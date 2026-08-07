import { useGame } from '../../game/GameContext'

export function HunterModal() {
  const { state, dispatch } = useGame()
  const skill = state.skills.combat
  return <div className="training-content"><div className="training-illustration" aria-hidden="true"><i /><i /><i /></div><section><span>凛的基础巡猎课程</span><h3>雾林反应训练</h3><p>识别三种魔物突进前兆，完成盾步、反击和安全撤离。每次消耗 1 点精力并获得 18 点战斗经验。</p><div className="experience-preview"><span style={{ width: `${skill.experience / skill.nextLevel * 100}%` }} /><small>战斗等级 {skill.level} · {skill.experience} / {skill.nextLevel}</small></div><button id="hunter-start-training" className="primary-button" type="button" disabled={state.energy < 1} onClick={() => dispatch({ type: 'TRAIN_COMBAT' })}>开始训练 · 1 精力</button></section></div>
}
