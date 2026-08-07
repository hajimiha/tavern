import { spells } from '../../game/data'
import { useGame } from '../../game/GameContext'
import type { ElementType } from '../../game/types'

const elementMeta: Record<ElementType, { name: string; over: string }> = {
  metal: { name: '金', over: '木' }, wood: { name: '木', over: '土' }, water: { name: '水', over: '火' }, fire: { name: '火', over: '金' }, earth: { name: '土', over: '水' },
}

export function LibraryModal() {
  const { state, dispatch } = useGame()
  const level = state.skills.magic.level
  return <div className="library-content"><div className="library-status"><div><span>魔法等级</span><strong>{level}</strong></div><div><span>当前魔力</span><strong>{state.stats.mana} / {state.stats.maxMana}</strong></div><p>五行循环：金克木、木克土、土克水、水克火、火克金。克制倍率 1.5，被克制倍率 0.75。</p></div><div className="spell-grid">{spells.map((spell) => { const known = state.knownSpells.includes(spell.id); const locked = spell.requiredLevel > level; const label = known ? `已经学习${spell.name}` : locked ? `魔法等级不足，无法学习${spell.name}` : state.energy < 1 ? `精力不足，无法学习${spell.name}` : `学习${spell.name}，消耗 1 点精力`; return <article key={spell.id} className={`spell-card element-${spell.element} ${known ? 'is-known' : ''}`}><header><span className="element-seal">{elementMeta[spell.element].name}</span><div><small>等级 {spell.requiredLevel} · 克制{elementMeta[spell.element].over}</small><h3>{spell.name}</h3></div></header><p>{spell.description}</p><dl><div><dt>魔力</dt><dd>{spell.manaCost}</dd></div><div><dt>威力</dt><dd>{spell.power}</dd></div><div><dt>类型</dt><dd>{spell.kind === 'damage' ? '伤害' : spell.kind === 'heal' ? '恢复' : '守护'}</dd></div></dl><button id={`spell-learn-${spell.id}`} type="button" aria-label={label} disabled={known || locked || state.energy < 1} onClick={() => dispatch({ type: 'LEARN_SPELL', spellId: spell.id })}>{known ? '已经掌握' : locked ? `需要魔法等级 ${spell.requiredLevel}` : '研习 · 1 精力'}</button></article> })}</div></div>
}
