import { useGame } from '../../game/GameContext'

export function StoryRail() {
  const { state, dispatch } = useGame()
  const readyPlots = state.plots.filter((plot) => plot.ready).length

  return (
    <aside className="story-rail panel-frame" aria-labelledby="story-rail-title">
      <div className="panel-heading">
        <span className="section-index">01</span>
        <div><p className="eyebrow">TODAY'S THREAD</p><h2 id="story-rail-title">今日线索</h2></div>
      </div>
      <ol className="story-list">
        <li className="story-item story-primary">
          <span className="story-line" aria-hidden="true" />
          <div><span>追踪中 · 村民委托</span><strong>雾后新芽</strong><p>再取得 1 份雾荚豆，交给芙蕾雅。</p></div>
        </li>
        <li className="story-item">
          <span className="story-line" aria-hidden="true" />
          <div><span>农场动态</span><strong>{readyPlots} 块田地可以收获</strong><p>夕照麦已在薄雾中成熟。</p></div>
        </li>
        <li className="story-item">
          <span className="story-line" aria-hidden="true" />
          <div><span>每日机会</span><strong>医院恢复尚未使用</strong><p>支付 180 金币可恢复 2 点精力。</p></div>
        </li>
      </ol>
      <button id="story-open-journal" className="text-button" type="button" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'journal' })}>查看完整手册 <span aria-hidden="true">›</span></button>
    </aside>
  )
}
