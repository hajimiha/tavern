import { useMemo, useState } from 'react'
import { useGame } from '../../game/GameContext'
import {
  formatClock,
  formatGameDate,
  getCalendarDate,
  getDayOfYear,
  getFestivalOnDay,
  getNpcPresence,
  getNpcScheduleForDay,
  MONTH_LENGTHS,
  WEEKDAYS,
} from '../../game/calendar'
import { locations, npcs } from '../../game/data'
import { GameIcon } from '../icons/GameIcon'

type CalendarTab = 'month' | 'schedule' | 'pass-time'

function clampInteger(raw: string, minimum: number, maximum: number) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return minimum
  return Math.min(maximum, Math.max(minimum, Math.floor(parsed)))
}

function advanceDate(year: number, day: number, minutes: number, elapsedMinutes: number) {
  const totalMinutes = minutes + elapsedMinutes
  const crossedDays = Math.floor(totalMinutes / 1440)
  const absoluteDay = (year - 1) * 365 + day - 1 + crossedDays
  return {
    year: Math.floor(absoluteDay / 365) + 1,
    day: absoluteDay % 365 + 1,
    minutes: totalMinutes % 1440,
  }
}

export function CalendarModal() {
  const { state, dispatch } = useGame()
  const today = getCalendarDate(state.year, state.day)
  const [tab, setTab] = useState<CalendarTab>('month')
  const [viewYear, setViewYear] = useState(state.year)
  const [viewMonth, setViewMonth] = useState(today.month)
  const [selectedYear, setSelectedYear] = useState(state.year)
  const [selectedDay, setSelectedDay] = useState(state.day)
  const [selectedNpcId, setSelectedNpcId] = useState(npcs[0].id)
  const [targetTime, setTargetTime] = useState(formatClock((state.minutes + 60) % 1440))
  const [durationDays, setDurationDays] = useState('0')
  const [durationHours, setDurationHours] = useState('1')
  const [durationMinutes, setDurationMinutes] = useState('0')

  const selectedDate = getCalendarDate(selectedYear, selectedDay)
  const selectedFestival = getFestivalOnDay(selectedDay)
  const selectedBirthdays = npcs.filter((npc) => getDayOfYear(npc.birthday.month, npc.birthday.day) === selectedDay)
  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId) ?? npcs[0]
  const currentPresence = getNpcPresence(selectedNpc.id, state.year, state.day, state.minutes)
  const currentLocation = locations.find((location) => location.id === currentPresence.locationId)
  const selectedSchedule = getNpcScheduleForDay(selectedNpc.id, selectedYear, selectedDay)

  const monthStartDay = getDayOfYear(viewMonth, 1)
  const monthLength = MONTH_LENGTHS[viewMonth - 1]
  const monthStartOffset = WEEKDAYS.indexOf(getCalendarDate(viewYear, monthStartDay).weekday as typeof WEEKDAYS[number])
  const calendarCells = Array.from({ length: Math.ceil((monthStartOffset + monthLength) / 7) * 7 }, (_, index) => {
    const date = index - monthStartOffset + 1
    return date >= 1 && date <= monthLength ? date : null
  })

  const exactElapsed = useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(targetTime)) return 0
    const [hours, minutes] = targetTime.split(':').map(Number)
    if (hours > 23 || minutes > 59) return 0
    const target = hours * 60 + minutes
    const difference = target - state.minutes
    return difference <= 0 ? difference + 1440 : difference
  }, [targetTime, state.minutes])
  const exactTarget = advanceDate(state.year, state.day, state.minutes, exactElapsed)

  const durationTotal = (
    clampInteger(durationDays, 0, 365) * 1440
    + clampInteger(durationHours, 0, 23) * 60
    + clampInteger(durationMinutes, 0, 59)
  )
  const durationTarget = advanceDate(state.year, state.day, state.minutes, durationTotal)
  const durationValid = durationTotal > 0 && durationTotal <= 365 * 1440
  const blocked = Boolean(state.battle)

  const selectDate = (year: number, month: number, date: number) => {
    setSelectedYear(year)
    setSelectedDay(getDayOfYear(month, date))
  }
  const changeMonth = (direction: -1 | 1) => {
    if (direction < 0 && viewYear === 1 && viewMonth === 1) return
    const nextMonthIndex = (viewYear - 1) * 12 + viewMonth - 1 + direction
    setViewYear(Math.floor(nextMonthIndex / 12) + 1)
    setViewMonth(nextMonthIndex % 12 + 1)
  }
  const goToFestival = () => {
    if (!selectedFestival || selectedYear !== state.year || selectedDay !== state.day) return
    const location = locations.find((item) => item.id === selectedFestival.locationId)
    if (!location) return
    dispatch({ type: 'TRAVEL_TO_LOCATION', location: location.id, minutes: location.travelMinutes })
    dispatch({ type: 'CLOSE_MODAL' })
  }

  return <div className="calendar-console">
    <nav className="calendar-tabs" role="tablist" aria-label="岁时手册页面">
      {([
        ['month', '月历纪事', 'calendar'],
        ['schedule', '人物行程', 'location'],
        ['pass-time', '消磨时间', 'hourglass'],
      ] as const).map(([id, label, icon]) => <button
        id={`calendar-tab-${id}`}
        key={id}
        type="button"
        role="tab"
        aria-selected={tab === id}
        aria-controls={`calendar-panel-${id}`}
        onClick={() => setTab(id)}
      ><GameIcon name={icon} size={18} weight="duotone" /><span>{label}</span></button>)}
    </nav>

    {tab === 'month' && <section id="calendar-panel-month" className="calendar-month-panel" role="tabpanel" aria-labelledby="calendar-tab-month">
      <div className="calendar-board">
        <header className="calendar-board-heading">
          <button id="calendar-previous-month" className="icon-button" type="button" aria-label="查看上个月" disabled={viewYear === 1 && viewMonth === 1} onClick={() => changeMonth(-1)}><GameIcon name="panLeft" size={17} /></button>
          <div><span>YEAR {String(viewYear).padStart(2, '0')}</span><h3>第{viewYear}年 · {viewMonth}月</h3><p>{getCalendarDate(viewYear, monthStartDay).season}季月志</p></div>
          <button id="calendar-next-month" className="icon-button" type="button" aria-label="查看下个月" onClick={() => changeMonth(1)}><GameIcon name="panRight" size={17} /></button>
        </header>
        <table aria-label={`第${viewYear}年${viewMonth}月月历`}>
          <thead><tr>{WEEKDAYS.map((weekday) => <th key={weekday} scope="col">{weekday.slice(1)}</th>)}</tr></thead>
          <tbody>{Array.from({ length: calendarCells.length / 7 }, (_, row) => <tr key={row}>{calendarCells.slice(row * 7, row * 7 + 7).map((date, column) => {
            if (!date) return <td key={`blank-${row}-${column}`} className="is-empty" />
            const day = getDayOfYear(viewMonth, date)
            const festival = getFestivalOnDay(day)
            const birthdays = npcs.filter((npc) => getDayOfYear(npc.birthday.month, npc.birthday.day) === day)
            const isToday = viewYear === state.year && day === state.day
            const isSelected = viewYear === selectedYear && day === selectedDay
            const labels = [`${viewMonth}月${date}日`, getCalendarDate(viewYear, day).weekday]
            if (festival) labels.push(festival.name)
            if (birthdays.length) labels.push(`${birthdays.map((npc) => npc.name).join('、')}生日`)
            if (isToday) labels.push('今天')
            return <td key={date}><button
              id={`calendar-day-${viewYear}-${day}`}
              type="button"
              className={`${isToday ? 'is-today ' : ''}${isSelected ? 'is-selected ' : ''}${festival ? 'has-festival ' : ''}${birthdays.length ? 'has-birthday' : ''}`}
              aria-label={labels.join('，')}
              aria-pressed={isSelected}
              onClick={() => selectDate(viewYear, viewMonth, date)}
            ><strong>{date}</strong><span>{festival?.name ?? ''}</span><i aria-hidden="true">{festival ? <GameIcon name="festival" size={12} weight="fill" /> : birthdays.length ? <GameIcon name="birthday" size={12} weight="fill" /> : null}</i></button></td>
          })}</tr>)}</tbody>
        </table>
        <div className="calendar-legend" aria-label="月历图例"><span><i className="today-key" />今天</span><span><GameIcon name="festival" size={13} />节日</span><span><GameIcon name="birthday" size={13} />生日</span></div>
      </div>

      <aside className="calendar-day-detail" aria-label={`${selectedDate.month}月${selectedDate.date}日详情`}>
        <header><span>{selectedDate.weekday} · {selectedDate.season}季</span><strong>{String(selectedDate.date).padStart(2, '0')}</strong><div><h3>{selectedDate.month}月{selectedDate.date}日</h3><p>第{selectedDate.year}年 · 第{selectedDate.dayOfYear}天</p></div></header>
        {selectedBirthdays.length > 0 && <section className="birthday-block"><span><GameIcon name="birthday" size={18} weight="duotone" />今日生日</span>{selectedBirthdays.map((npc) => <p key={npc.id}><strong>{npc.name}的生日</strong><small>{npc.role} · 偏爱礼物会获得双倍好感</small></p>)}</section>}
        {selectedFestival ? <section className="festival-block"><span><GameIcon name="festival" size={18} weight="duotone" />月度节日</span><h3>{selectedFestival.name}</h3><p>{selectedFestival.description}</p><div className="festival-venue"><GameIcon name="location" size={15} /><span>{locations.find((location) => location.id === selectedFestival.locationId)?.name}</span><small>{formatClock(selectedFestival.startMinute)}–{selectedFestival.endMinute === 1440 ? '24:00' : formatClock(selectedFestival.endMinute)}</small></div><ol>{selectedFestival.activities.map((activity) => <li key={activity.id}><time>{formatClock(activity.startMinute)}</time><div><strong>{activity.name}</strong><p>{activity.description}</p></div></li>)}</ol><button id={`calendar-travel-${selectedFestival.id}`} className="primary-button" type="button" disabled={selectedYear !== state.year || selectedDay !== state.day || blocked} onClick={goToFestival}>前往节日会场</button>{selectedYear !== state.year || selectedDay !== state.day ? <small>节日当天才可直接前往会场</small> : null}</section> : <section className="quiet-day"><GameIcon name="calendar" size={24} weight="duotone" /><h3>寻常村日</h3><p>没有大型庆典，适合经营农场、拜访村民或安排探索。</p></section>}
      </aside>
    </section>}

    {tab === 'schedule' && <section id="calendar-panel-schedule" className="calendar-schedule-panel" role="tabpanel" aria-labelledby="calendar-tab-schedule">
      <header className="schedule-overview"><div><span>LIVE ROUTE</span><h3>{selectedNpc.name}的一日</h3><p>{selectedDate.month}月{selectedDate.date}日 · {selectedDate.weekday}</p></div><label htmlFor="calendar-npc-select">查看人物<select id="calendar-npc-select" value={selectedNpc.id} onChange={(event) => setSelectedNpcId(event.target.value)}>{npcs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name} · {npc.role}</option>)}</select></label></header>
      <div className="schedule-current-card" aria-label="人物当前位置"><span><GameIcon name="location" size={18} weight="duotone" />当前所在</span><strong>{currentLocation?.name ?? currentPresence.locationId}</strong><p>{formatClock(currentPresence.startMinute)}–{currentPresence.endMinute === 1440 ? '24:00' : formatClock(currentPresence.endMinute)} · {currentPresence.activity}</p></div>
      <ol className="schedule-timeline">{selectedSchedule.map((item, index) => {
        const location = locations.find((candidate) => candidate.id === item.locationId)
        const current = selectedYear === state.year && selectedDay === state.day && state.minutes >= item.startMinute && state.minutes < item.endMinute
        return <li key={`${item.startMinute}-${item.locationId}`} className={current ? 'is-current' : ''}><time>{formatClock(item.startMinute)}<small>{item.endMinute === 1440 ? '24:00' : formatClock(item.endMinute)}</small></time><i aria-hidden="true" /><div><span>{location?.name ?? item.locationId}</span><strong aria-current={current ? 'time' : undefined}>{item.activity}</strong>{index < selectedSchedule.length - 1 && <small>下一站 · {locations.find((candidate) => candidate.id === selectedSchedule[index + 1].locationId)?.name}</small>}</div></li>
      })}</ol>
    </section>}

    {tab === 'pass-time' && <section id="calendar-panel-pass-time" className="calendar-pass-panel" role="tabpanel" aria-labelledby="calendar-tab-pass-time">
      <header className="pass-time-heading"><span className="pass-time-mark"><GameIcon name="hourglass" size={30} weight="duotone" /></span><div><span>TIME PASSAGE</span><h3>让村庄继续运转</h3><p>作物、节日与人物行程都会随时间推进。跨日后恢复每日精力与互动机会。</p></div></header>
      {blocked && <div className="calendar-time-warning" role="status"><GameIcon name="warning" size={18} weight="duotone" /><div><strong>战斗中不能消磨时间</strong><p>请先结束当前回合制战斗，再安排后续日程。</p></div></div>}
      <div className="pass-time-grid">
        <form className="time-card" onSubmit={(event) => { event.preventDefault(); if (!blocked && exactElapsed > 0) dispatch({ type: 'ADVANCE_TIME', minutes: exactElapsed, reason: `等待至 ${targetTime}` }) }}>
          <span className="time-card-index">01 · 指定时刻</span><h4>跳到几点几分</h4><p>若目标时刻已经过去或正好等于现在，将自动前进到次日。</p><label htmlFor="calendar-target-time">目标时间<input id="calendar-target-time" type="time" value={targetTime} onChange={(event) => setTargetTime(event.target.value)} /></label><output className="time-preview">目标：{formatGameDate(exactTarget.year, exactTarget.day)} {formatClock(exactTarget.minutes)}<small>经过 {Math.floor(exactElapsed / 60)} 小时 {exactElapsed % 60} 分钟</small></output><button id="calendar-advance-to-time" className="primary-button" type="submit" disabled={blocked || exactElapsed <= 0}>确认消磨时间</button>
        </form>
        <form className="time-card" onSubmit={(event) => { event.preventDefault(); if (!blocked && durationValid) dispatch({ type: 'ADVANCE_TIME', minutes: durationTotal, reason: '按计划消磨时间' }) }}>
          <span className="time-card-index">02 · 经过时长</span><h4>等待几天之后</h4><p>可组合天、小时和分钟，单次最多推进 365 天。</p><div className="duration-inputs"><label htmlFor="calendar-duration-days">经过天数<input id="calendar-duration-days" type="number" min="0" max="365" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} /></label><label htmlFor="calendar-duration-hours">经过小时<input id="calendar-duration-hours" type="number" min="0" max="23" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} /></label><label htmlFor="calendar-duration-minutes">经过分钟<input id="calendar-duration-minutes" type="number" min="0" max="59" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} /></label></div><output className="time-preview">目标：{formatGameDate(durationTarget.year, durationTarget.day)} {formatClock(durationTarget.minutes)}<small>共 {Math.floor(durationTotal / 60)} 小时 {durationTotal % 60} 分钟</small></output><button id="calendar-advance-duration" className="primary-button" type="submit" disabled={blocked || !durationValid}>按时长消磨时间</button>
        </form>
      </div>
    </section>}
  </div>
}
