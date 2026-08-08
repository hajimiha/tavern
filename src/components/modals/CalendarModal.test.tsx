import '../../test/setup'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider, useGame } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

function ClockObserver() {
  const { state } = useGame()
  return <output aria-label="游戏当前时间">第{state.year}年 第{state.day}日 {state.minutes}</output>
}

function renderCalendar(overrides = {}) {
  return render(
    <GameProvider initialState={{ ...initialGameState, activeModal: 'calendar', ...overrides }}>
      <ClockObserver />
      <ModalHost />
    </GameProvider>,
  )
}

describe('岁时手册', () => {
  it('在语义月历中标出节日和生日，并可查看人物全天行程', async () => {
    const user = userEvent.setup()
    renderCalendar()

    expect(screen.getByRole('dialog', { name: '岁时手册' })).toBeVisible()
    expect(screen.getByRole('table', { name: '第1年1月月历' })).toBeVisible()
    expect(screen.getByRole('button', { name: /1月12日.*迎岁灯会/ })).toBeVisible()

    await user.click(screen.getByRole('button', { name: /1月18日.*洛岚生日/ }))
    expect(screen.getByText('洛岚的生日')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /1月1日.*今天/ }))

    await user.click(screen.getByRole('tab', { name: '人物行程' }))
    expect(screen.getByText('当前所在')).toBeVisible()
    expect(screen.getByLabelText('人物当前位置')).toHaveTextContent('村长家')
    expect(screen.getByText('休息并准备一天')).toHaveAttribute('aria-current', 'time')
  })

  it('指定时刻早于当前时自动跳到次日并显示准确预览', async () => {
    const user = userEvent.setup()
    renderCalendar({ minutes: 23 * 60 + 50 })

    await user.click(screen.getByRole('tab', { name: '消磨时间' }))
    fireEvent.change(screen.getByLabelText('目标时间'), { target: { value: '08:15' } })
    expect(screen.getByText('目标：第1年1月2日 08:15')).toBeVisible()

    await user.click(screen.getByRole('button', { name: '确认消磨时间' }))
    expect(screen.getByLabelText('游戏当前时间')).toHaveTextContent('第1年 第2日 495')
  })

  it('可按天、小时和分钟消磨时间，且战斗中禁止跳时', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCalendar()
    await user.click(screen.getByRole('tab', { name: '消磨时间' }))

    fireEvent.change(screen.getByLabelText('经过天数'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('经过小时'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('经过分钟'), { target: { value: '20' } })
    expect(screen.getByText(/共 51 小时 20 分钟/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: '按时长消磨时间' }))
    expect(screen.getByLabelText('游戏当前时间')).toHaveTextContent('第1年 第3日 590')

    unmount()
    renderCalendar({ battle: { floor: 1, enemyName: '史莱姆', enemyElement: 'water', enemyHealth: 8, enemyMaxHealth: 8, turn: 1, log: [] } })
    await user.click(screen.getByRole('tab', { name: '消磨时间' }))
    expect(screen.getByText('战斗中不能消磨时间')).toBeVisible()
    expect(screen.getByRole('button', { name: '确认消磨时间' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '按时长消磨时间' })).toBeDisabled()
  })
})
