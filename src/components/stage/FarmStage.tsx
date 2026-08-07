import type { CSSProperties } from 'react'
import farmDuskImage from '../../assets/pixel/farm-dusk.webp'
import { crops } from '../../game/data'
import { useGame } from '../../game/GameContext'
import type { Plot } from '../../game/types'
import { GameIcon } from '../icons/GameIcon'

function formatRemaining(hours: number) {
  if (hours <= 0) return '已经成熟'
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  if (!days) return `${rest}小时后成熟`
  if (!rest) return `${days}日后成熟`
  return `${days}日${rest}小时后成熟`
}

function plotLabel(plot: Plot) {
  const crop = crops.find((item) => item.id === plot.cropId)
  return crop
    ? `地块 ${plot.row}-${plot.column}，${crop.name}，${plot.ready ? '已经成熟' : formatRemaining(plot.remainingHours ?? 0)}`
    : `地块 ${plot.row}-${plot.column}，空地`
}

export function FarmStage() {
  const { state, dispatch } = useGame()
  const selected = state.activeModal === 'plot'
    ? state.plots.find((plot) => plot.id === state.selectedPlotId)
    : undefined
  const selectedCrop = crops.find((crop) => crop.id === selected?.cropId)
  const matureCount = state.plots.filter((plot) => plot.ready).length
  const fertilizerCount = state.inventory['moss-fertilizer'] ?? 0
  const close = () => dispatch({ type: 'CLOSE_MODAL' })

  const harvest = () => {
    if (!selected) return
    dispatch({ type: 'HARVEST_PLOT', plotId: selected.id })
    close()
  }

  return (
    <section className="world-stage farm-stage panel-frame" aria-labelledby="stage-title">
      <img className="farm-scene" src={farmDuskImage} width="1672" height="941" alt="苔灯农场暮色场景，田垄、温室与农舍被薄雾笼罩" decoding="async" />
      <div className="farm-vignette" aria-hidden="true" />
      <div className="stage-atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <header className="stage-titlebar">
        <div><p className="eyebrow">SOUTH FIELD · 第{state.day}日</p><h1 id="stage-title">南坡田区</h1></div>
        <span className="weather-pill">{state.weather} · {state.plots.some((plot) => plot.watered) ? '土壤湿润' : '等待开垦'}</span>
      </header>

      <div className="farm-stage-copy">
        <span>{state.season} · 成熟作物 {matureCount}</span>
        <strong>{state.plots.some((plot) => plot.cropId) ? '田垄已有新芽，今天的劳作正等待你的安排。' : '刚接手的田地还很安静，从第一包种子开始吧。'}</strong>
      </div>

      <div className="farm-grid" aria-label="四行六列农田">
        {state.plots.map((plot) => {
          const crop = crops.find((item) => item.id === plot.cropId)
          return (
            <button
              id={`farm-${plot.id}`}
              key={plot.id}
              className={`farm-plot ${crop ? 'has-crop' : 'is-empty'} ${plot.ready ? 'is-ready' : ''} ${plot.watered ? 'is-watered' : ''}`}
              style={{ '--crop-color': crop?.color ?? '#6b4b31' } as CSSProperties}
              type="button"
              aria-label={plotLabel(plot)}
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'plot', plotId: plot.id })}
            >
              <span className="crop-sprite" aria-hidden="true"><i /><i /><i /></span>
              <span className="plot-status">
                <strong>{crop?.name ?? '空地'}</strong>
                <small>{crop ? (plot.ready ? '可收获' : formatRemaining(plot.remainingHours ?? 0).replace('后成熟', '')) : '可播种'}</small>
              </span>
              {plot.watered && <span className="water-mark" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      {selected && (
        <section className="plot-dialog" role="dialog" aria-modal="false" aria-labelledby="plot-dialog-title">
          <header>
            <div><span>田区 {selected.row}—{selected.column}</span><h2 id="plot-dialog-title">地块详情</h2></div>
            <button id="plot-dialog-close" className="icon-button" type="button" aria-label="关闭地块详情" onClick={close}><GameIcon name="close" size={17} /></button>
          </header>
          <div className="plot-dialog-crop">
            <span className={`crop-emblem ${selected.ready ? 'is-ready' : ''}`} style={{ '--crop-color': selectedCrop?.color ?? '#74543b' } as CSSProperties} aria-hidden="true"><i /></span>
            <div><strong>{selectedCrop?.name ?? '休耕空地'}</strong><p>{selectedCrop?.description ?? '土壤松软，适合播下本季种子。'}</p></div>
          </div>
          {selectedCrop && <div className="growth-meter"><span style={{ width: `${selected.ready ? 100 : Math.max(8, 100 - ((selected.remainingHours ?? 0) / selectedCrop.growthHours) * 100)}%` }} /><small>{selected.ready ? '已经成熟' : formatRemaining(selected.remainingHours ?? 0)}</small></div>}
          <div className="plot-actions">
            <button id={`plot-water-${selected.id}`} type="button" aria-label={`给地块 ${selected.row}-${selected.column} 浇水`} disabled={!selectedCrop || selected.ready || selected.watered} onClick={() => dispatch({ type: 'WATER_PLOT', plotId: selected.id })}><span>浇水</span><small>{selected.watered ? '今日已浇水' : '0 精力'}</small></button>
            <button id={`plot-fertilize-${selected.id}`} type="button" aria-label={`给地块 ${selected.row}-${selected.column} 施肥`} disabled={!selectedCrop || selected.ready || selected.fertilized || fertilizerCount < 1} onClick={() => dispatch({ type: 'FERTILIZE_PLOT', plotId: selected.id })}><span>施用苔肥</span><small>{selected.fertilized ? '已经施肥' : `1 份 · 持有 ${fertilizerCount}`}</small></button>
            <button id={`plot-harvest-${selected.id}`} className="harvest-action" type="button" aria-label={selectedCrop ? `收获地块 ${selected.row}-${selected.column} 的${selectedCrop.name}` : '当前地块没有可收获作物'} disabled={!selectedCrop || !selected.ready} onClick={harvest}><span>收获</span><small>{selected.ready ? '预计 3 份' : '尚未成熟'}</small></button>
          </div>
          {!selectedCrop && <p className="plot-inline-note">播种功能已纳入杂货店的种子流程；购买种子后可在此地块选择种植。</p>}
        </section>
      )}
    </section>
  )
}
