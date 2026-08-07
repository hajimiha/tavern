import { useGame } from '../../game/GameContext'

export function HospitalModal() {
  const { state, dispatch } = useGame()
  const disabled = state.hospitalUsedToday || state.energy >= state.maxEnergy || state.money < 180
  const label = state.hospitalUsedToday ? '今日已经接受过精力治疗' : state.energy >= state.maxEnergy ? '当前精力已经充足' : state.money < 180 ? '金币不足，无法接受治疗' : '支付 180 金币，恢复 2 点精力'
  return <div className="hospital-content"><div className="hospital-mark" aria-hidden="true"><i /></div><section><span>白槿诊所 · 每日一次</span><h3>草药热敷与静息治疗</h3><p>维娜会以温热草药包缓解疲劳，立即恢复 2 点精力，但不会超过当前上限。</p><dl><div><dt>当前精力</dt><dd>{state.energy} / {state.maxEnergy}</dd></div><div><dt>预计恢复</dt><dd>+{Math.min(2, state.maxEnergy - state.energy)}</dd></div><div><dt>费用</dt><dd>180 金币</dd></div></dl><button id="hospital-recover-energy" className="primary-button" type="button" aria-label={label} disabled={disabled} onClick={() => dispatch({ type: 'USE_HOSPITAL' })}>{label}</button></section></div>
}
