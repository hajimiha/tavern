import { useState } from 'react'
import { affinityStageNames, itemDisplayNames, npcs, shopItems } from '../../game/data'
import { useGame } from '../../game/GameContext'
import type { NpcAction } from '../../game/types'
import { GameIcon, type GameIconName } from '../icons/GameIcon'

const actions: { id: NpcAction; label: string; icon: GameIconName }[] = [
  { id: 'chat', label: '交谈', icon: 'chat' },
  { id: 'gift', label: '赠礼', icon: 'gift' },
  { id: 'trade', label: '交易', icon: 'shop' },
  { id: 'quest', label: '提交任务', icon: 'quest' },
  { id: 'profile', label: '人物档案', icon: 'profile' },
]

export function NpcPanel({ npcId }: { npcId: string }) {
  const { state, dispatch } = useGame()
  const [subview, setSubview] = useState<'actions' | 'gift' | 'quest' | 'profile'>('actions')
  const npc = npcs.find((item) => item.id === npcId)!
  const relationship = state.relationships[npcId]
  const npcQuests = state.quests.filter((quest) => quest.issuerId === npcId)
  const giftItems = npc.preferredGifts.filter((itemId) => (state.inventory[itemId] ?? 0) > 0)

  const selectAction = (action: NpcAction) => {
    if (!npc.availableActions.includes(action)) return
    if (action === 'chat') {
      if (state.energy < 1) {
        dispatch({ type: 'ADD_TOAST', toast: { tone: 'warning', title: '精力不足', message: '需要 1 点精力才能与她深入交谈。' } })
        return
      }
      dispatch({ type: 'CHAT_WITH_NPC', npcId })
      dispatch({ type: 'OPEN_MODAL', modal: 'dialogue', npcId })
    } else if (action === 'trade') dispatch({ type: 'OPEN_MODAL', modal: 'trade', npcId })
    else setSubview(action)
  }

  return (
    <section className="npc-panel" role="dialog" aria-modal="false" aria-label={`${npc.name}互动面板`}>
      <header><div><span>{npc.role} · 好感 {relationship.affinity}</span><h2>{npc.name}</h2></div><button id={`npc-panel-close-${npc.id}`} className="icon-button" type="button" aria-label={`关闭${npc.name}互动面板`} onClick={() => dispatch({ type: 'CLOSE_MODAL' })}><GameIcon name="close" size={17} /></button></header>
      {subview === 'actions' && <>
        <p className="npc-panel-quote">{npc.description}</p>
        <div className="npc-action-grid">
          {actions.map((action) => {
            const available = npc.availableActions.includes(action.id)
            const aria = action.id === 'chat' ? `与${npc.name}交谈` : action.id === 'gift' ? `赠礼给${npc.name}` : action.id === 'trade' ? `与${npc.name}交易` : action.id === 'quest' ? `向${npc.name}提交任务` : `查看${npc.name}人物档案`
            return <button id={`npc-action-${action.id}-${npc.id}`} key={action.id} type="button" aria-label={aria} disabled={!available} onClick={() => selectAction(action.id)}><GameIcon name={action.icon} size={20} weight="duotone" /><span>{action.label}</span><small>{available ? (action.id === 'chat' || action.id === 'gift' ? '消耗 1 精力' : '查看详情') : '该人物不提供'}</small></button>
          })}
        </div>
      </>}
      {subview === 'gift' && <div className="npc-subview"><button id={`npc-subview-back-gift-${npc.id}`} className="subview-back" type="button" onClick={() => setSubview('actions')}>返回互动</button><h3>挑选礼物</h3><p>她偏爱的礼物会获得 14 点好感，赠礼消耗 1 点精力。</p>{giftItems.length ? giftItems.map((itemId) => <button id={`npc-gift-${npc.id}-${itemId}`} key={itemId} type="button" onClick={() => { dispatch({ type: 'GIVE_GIFT', npcId, itemId, affinity: 14 }); setSubview('actions') }}><strong>{shopItems.find((item) => item.id === itemId)?.name ?? itemDisplayNames[itemId] ?? '未鉴定礼物'}</strong><small>持有 {state.inventory[itemId]}</small></button>) : <div className="inline-warning">背包中没有她偏爱的礼物。</div>}</div>}
      {subview === 'quest' && <div className="npc-subview"><button id={`npc-subview-back-quest-${npc.id}`} className="subview-back" type="button" onClick={() => setSubview('actions')}>返回互动</button><h3>任务交付</h3>{npcQuests.length ? npcQuests.map((quest) => { const held = state.inventory[quest.requiredItemId] ?? 0; return <div className="npc-quest-row" key={quest.id}><strong>{quest.title}</strong><p>{quest.description}</p><small>进度 {held} / {quest.requiredAmount} · 报酬 {quest.rewardMoney} 金币</small><button id={`npc-submit-${quest.id}`} type="button" disabled={held < quest.requiredAmount || quest.status === 'completed'} onClick={() => dispatch({ type: 'SUBMIT_QUEST', questId: quest.id })}>{quest.status === 'completed' ? '已经完成' : '提交物品'}</button></div> }) : <div className="inline-warning">她目前没有等待交付的委托。</div>}</div>}
      {subview === 'profile' && <div className="npc-subview profile-subview"><button id={`npc-subview-back-profile-${npc.id}`} className="subview-back" type="button" onClick={() => setSubview('actions')}>返回互动</button><h3>人物档案</h3><dl><div><dt>关系阶段</dt><dd>{affinityStageNames[relationship.stage]}</dd></div><div><dt>今日交谈</dt><dd>{relationship.chattedToday ? '已完成' : '尚未'}</dd></div><div><dt>今日赠礼</dt><dd>{relationship.giftedToday ? '已完成' : '尚未'}</dd></div></dl><h4>她记得</h4><ul>{relationship.memoryTags.length ? relationship.memoryTags.map((tag) => <li key={tag}>{tag}</li>) : <li>尚未留下共同回忆</li>}</ul></div>}
    </section>
  )
}
