import { createInitialPlots, npcs, quests, spells } from './data'
import { canSpendEnergy, elementAdvantage } from './rules'
import type { GameAction, GameState, Relationship, ToastMessage } from './types'

let toastSequence = 0
const makeToast = (toast: Omit<ToastMessage, 'id'>): ToastMessage => ({
  ...toast,
  id: `notice-${Date.now()}-${toastSequence++}`,
})

const initialRelationships = Object.fromEntries(
  npcs.map((npc) => [npc.id, {
    affinity: 0,
    stage: 'stranger',
    chattedToday: false,
    giftedToday: false,
    memoryTags: [],
  } satisfies Relationship]),
)

function affinityStage(affinity: number): Relationship['stage'] {
  if (affinity >= 110) return 'bonded'
  if (affinity >= 75) return 'intimate'
  if (affinity >= 45) return 'trusted'
  if (affinity >= 20) return 'acquainted'
  return 'stranger'
}

export const initialGameState: GameState = {
  day: 1,
  season: '春',
  weekday: '周一',
  minutes: 6 * 60 + 30,
  weather: '晴',
  location: 'farm',
  energy: 5,
  maxEnergy: 5,
  money: 500,
  skills: {
    fishing: { level: 1, experience: 0, nextLevel: 60 },
    farming: { level: 1, experience: 0, nextLevel: 60 },
    mining: { level: 1, experience: 0, nextLevel: 60 },
    combat: { level: 1, experience: 0, nextLevel: 60 },
    magic: { level: 1, experience: 0, nextLevel: 60 },
  },
  stats: { health: 20, maxHealth: 20, attack: 4, mana: 10, maxMana: 10, magicDamage: 3 },
  inventory: {
    'moon-radish-seed': 8,
    'mist-bean-seed': 4,
  },
  plots: createInitialPlots(),
  relationships: initialRelationships,
  quests: quests.map((quest) => ({ ...quest, status: 'available' })),
  knownSpells: [],
  mine: { currentFloor: 1, highestFloor: 1, unlockedElevators: [] },
  hospitalUsedToday: false,
  ownsMonsterRanch: false,
  tools: { hoe: 1, rod: 1, pickaxe: 1 },
  fishing: { active: false },
  activeModal: null,
  toasts: [],
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SPEND_ENERGY': {
      const permission = canSpendEnergy(state, action.amount)
      if (!permission.allowed) {
        return {
          ...state,
          toasts: [...state.toasts, makeToast({
            tone: 'warning',
            title: '行动受阻',
            message: `精力不足，无法${action.reason}`,
          })],
        }
      }
      return { ...state, energy: state.energy - action.amount }
    }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, makeToast(action.toast)] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) }
    case 'OPEN_MODAL':
      return { ...state, activeModal: action.modal, selectedNpcId: action.npcId, selectedPlotId: action.plotId }
    case 'CLOSE_MODAL':
      return { ...state, activeModal: null, selectedNpcId: undefined, selectedPlotId: undefined }
    case 'TRAVEL_TO_LOCATION':
      return { ...state, location: action.location, minutes: state.minutes + action.minutes }
    case 'WATER_PLOT':
      return {
        ...state,
        plots: state.plots.map((plot) => plot.id === action.plotId ? { ...plot, watered: true } : plot),
      }
    case 'FERTILIZE_PLOT': {
      if ((state.inventory['moss-fertilizer'] ?? 0) < 1) {
        return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '苔肥不足', message: '背包里没有可用的苔肥。' })] }
      }
      return {
        ...state,
        inventory: { ...state.inventory, 'moss-fertilizer': state.inventory['moss-fertilizer'] - 1 },
        plots: state.plots.map((plot) => {
          if (plot.id !== action.plotId || !plot.cropId || plot.fertilized) return plot
          const remainingHours = Math.max(0, (plot.remainingHours ?? 0) - 8)
          return { ...plot, fertilized: true, remainingHours, ready: remainingHours === 0 }
        }),
      }
    }
    case 'HARVEST_PLOT': {
      const plot = state.plots.find((item) => item.id === action.plotId)
      if (!plot?.cropId || !plot.ready) return state
      const harvestAmount = 3
      return {
        ...state,
        inventory: { ...state.inventory, [plot.cropId]: (state.inventory[plot.cropId] ?? 0) + harvestAmount },
        plots: state.plots.map((item) => item.id === action.plotId
          ? { id: item.id, row: item.row, column: item.column, watered: false, fertilized: false, ready: false }
          : item),
        toasts: [...state.toasts, makeToast({ tone: 'success', title: '收获完成', message: `已将 ${harvestAmount} 份作物收入背包。` })],
      }
    }
    case 'CHAT_WITH_NPC': {
      if (state.energy < 1) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '精力不足', message: '今天已经没有精力继续交谈。' })] }
      const relationship = state.relationships[action.npcId]
      const gain = relationship.chattedToday ? 0 : 6
      const affinity = relationship.affinity + gain
      return {
        ...state,
        energy: state.energy - 1,
        relationships: { ...state.relationships, [action.npcId]: { ...relationship, affinity, stage: affinityStage(affinity), chattedToday: true } },
      }
    }
    case 'GIVE_GIFT': {
      const relationship = state.relationships[action.npcId]
      if (state.energy < 1 || (state.inventory[action.itemId] ?? 0) < 1 || relationship.giftedToday) {
        const message = state.energy < 1 ? '精力不足，无法赠礼。' : relationship.giftedToday ? '今天已经向她赠过礼物。' : '背包里没有这件礼物。'
        return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '赠礼未完成', message })] }
      }
      const affinity = relationship.affinity + action.affinity
      return {
        ...state,
        energy: state.energy - 1,
        inventory: { ...state.inventory, [action.itemId]: state.inventory[action.itemId] - 1 },
        relationships: { ...state.relationships, [action.npcId]: { ...relationship, affinity, stage: affinityStage(affinity), giftedToday: true, memoryTags: [...relationship.memoryTags, '收到用心挑选的礼物'] } },
        toasts: [...state.toasts, makeToast({ tone: 'success', title: '心意送达', message: `好感提升了 ${action.affinity} 点。` })],
      }
    }
    case 'SUBMIT_QUEST': {
      const quest = state.quests.find((item) => item.id === action.questId)
      if (!quest || quest.status === 'completed' || (state.inventory[quest.requiredItemId] ?? 0) < quest.requiredAmount) {
        return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '无法提交', message: '任务物品数量不足，或委托已经完成。' })] }
      }
      const issuer = state.relationships[quest.issuerId]
      const mayor = state.relationships.loran
      const issuerAffinity = issuer.affinity + quest.rewardAffinity
      const mayorAffinity = mayor.affinity + quest.mayorAffinity
      return {
        ...state,
        money: state.money + quest.rewardMoney,
        inventory: { ...state.inventory, [quest.requiredItemId]: state.inventory[quest.requiredItemId] - quest.requiredAmount },
        quests: state.quests.map((item) => item.id === quest.id ? { ...item, status: 'completed' } : item),
        relationships: {
          ...state.relationships,
          [quest.issuerId]: { ...issuer, affinity: issuerAffinity, stage: affinityStage(issuerAffinity), memoryTags: [...issuer.memoryTags, `完成委托「${quest.title}」`] },
          loran: { ...mayor, affinity: mayorAffinity, stage: affinityStage(mayorAffinity) },
        },
        toasts: [...state.toasts, makeToast({ tone: 'success', title: '委托完成', message: `获得 ${quest.rewardMoney} 金币，发布者与村长的好感都提升了。` })],
      }
    }
    case 'ACCEPT_QUEST':
      return { ...state, quests: state.quests.map((quest) => quest.id === action.questId && quest.status === 'available' ? { ...quest, status: 'active' } : quest) }
    case 'BUY_ITEM': {
      if (action.quantity < 1 || state.money < action.total) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '交易未完成', message: '金币不足，无法购买所选商品。' })] }
      return { ...state, money: state.money - action.total, inventory: { ...state.inventory, [action.itemId]: (state.inventory[action.itemId] ?? 0) + action.quantity }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '购买完成', message: '商品已经放入背包。' })] }
    }
    case 'SELL_ITEM': {
      const protectedByQuest = state.quests.some((quest) => quest.status === 'active' && quest.requiredItemId === action.itemId)
      if (action.quantity < 1 || (state.inventory[action.itemId] ?? 0) < action.quantity || protectedByQuest) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '无法出售', message: protectedByQuest ? '任务物品受到保护，完成或放弃委托后才能出售。' : '持有数量不足。' })] }
      return { ...state, money: state.money + action.total, inventory: { ...state.inventory, [action.itemId]: state.inventory[action.itemId] - action.quantity }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '出售完成', message: `获得 ${action.total} 金币。` })] }
    }
    case 'USE_HOSPITAL': {
      if (state.hospitalUsedToday || state.money < 180 || state.energy >= state.maxEnergy) return state
      return { ...state, money: state.money - 180, energy: Math.min(state.maxEnergy, state.energy + 2), hospitalUsedToday: true, toasts: [...state.toasts, makeToast({ tone: 'success', title: '治疗完成', message: '草药热敷让你恢复了 2 点精力。' })] }
    }
    case 'BUY_RANCH':
      if (state.ownsMonsterRanch || state.money < 2800) return state
      return { ...state, money: state.money - 2800, ownsMonsterRanch: true, toasts: [...state.toasts, makeToast({ tone: 'success', title: '牧场合同生效', message: '现在可以邀请魔物娘经营伙伴入住了。' })] }
    case 'TRAIN_COMBAT': {
      if (state.energy < 1) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '精力不足', message: '需要 1 点精力才能完成训练。' })] }
      return { ...state, energy: state.energy - 1, skills: { ...state.skills, combat: { ...state.skills.combat, experience: state.skills.combat.experience + 18 } }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '训练完成', message: '战斗经验提升 18 点。' })] }
    }
    case 'LEARN_SPELL': {
      const spell = spells.find((item) => item.id === action.spellId)
      if (!spell || state.knownSpells.includes(spell.id) || spell.requiredLevel > state.skills.magic.level || state.energy < 1) return state
      return { ...state, energy: state.energy - 1, knownSpells: [...state.knownSpells, spell.id], skills: { ...state.skills, magic: { ...state.skills.magic, experience: state.skills.magic.experience + 10 } }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '法术习得', message: `你掌握了「${spell.name}」。` })] }
    }
    case 'ENTER_MINE_FLOOR': {
      if (state.energy < 1 || action.floor < 1 || action.floor > state.mine.highestFloor + 1) return state
      const highestFloor = Math.max(state.mine.highestFloor, action.floor)
      const unlockedElevators = action.floor % 5 === 0 && !state.mine.unlockedElevators.includes(action.floor) ? [...state.mine.unlockedElevators, action.floor] : state.mine.unlockedElevators
      return { ...state, energy: state.energy - 1, mine: { currentFloor: action.floor, highestFloor, unlockedElevators }, toasts: [...state.toasts, makeToast({ tone: 'info', title: `抵达第 ${action.floor} 层`, message: action.floor % 5 === 0 ? '这里是安全电梯层，没有魔物，但仍可挖矿。' : '黑暗里传来魔物移动的回声。' })] }
    }
    case 'MINE_ORE': {
      if (state.energy < 1) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '精力不足', message: '需要 1 点精力才能开采矿脉。' })] }
      const copper = 1 + Math.floor(action.floor / 3)
      const iron = action.floor >= 5 ? Math.floor(action.floor / 5) : 0
      return { ...state, energy: state.energy - 1, inventory: { ...state.inventory, 'copper-ore': (state.inventory['copper-ore'] ?? 0) + copper, 'iron-ore': (state.inventory['iron-ore'] ?? 0) + iron }, skills: { ...state.skills, mining: { ...state.skills.mining, experience: state.skills.mining.experience + 12 + action.floor } }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '矿脉开采完成', message: `获得铜矿石 ${copper}${iron ? `、铁矿石 ${iron}` : ''}。` })] }
    }
    case 'START_BATTLE': {
      if (action.floor % 5 === 0) return state
      const elements = ['earth', 'wood', 'water', 'fire', 'metal'] as const
      const names = ['岩壳史莱姆', '蔓影獾', '潮穴水灵', '烬角蜥', '白铁蝠']
      const index = (action.floor - 1) % elements.length
      const enemyMaxHealth = 14 + action.floor * 3
      return { ...state, activeModal: 'battle', battle: { floor: action.floor, enemyName: names[index], enemyElement: elements[index], enemyHealth: enemyMaxHealth, enemyMaxHealth, turn: 1, log: [`第 ${action.floor} 层的${names[index]}挡住了去路。`] } }
    }
    case 'BATTLE_ACTION': {
      const battle = state.battle
      if (!battle || battle.ended) return state
      if (action.action === 'flee') return { ...state, activeModal: 'mine', battle: undefined, toasts: [...state.toasts, makeToast({ tone: 'info', title: '安全撤离', message: '你退回了本层入口，没有失去物品。' })] }
      let enemyHealth = battle.enemyHealth
      let playerHealth = state.stats.health
      let playerMana = state.stats.mana
      let inventory = state.inventory
      const log = [...battle.log]
      let damage = 0
      if (action.action === 'physical') { damage = state.stats.attack; log.push(`你挥出武器，造成 ${damage} 点物理伤害。`) }
      if (action.action === 'spell') {
        const spell = spells.find((item) => item.id === action.spellId)
        if (!spell || !state.knownSpells.includes(spell.id) || playerMana < spell.manaCost) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '无法施法', message: '魔力不足或尚未掌握该法术。' })] }
        playerMana -= spell.manaCost
        const multiplier = elementAdvantage(spell.element, battle.enemyElement)
        damage = Math.max(1, Math.round((spell.power + state.stats.magicDamage) * multiplier))
        log.push(`你施放「${spell.name}」，五行倍率 ${multiplier}，造成 ${damage} 点伤害。`)
      }
      if (action.action === 'item') {
        if ((inventory['energy-tonic'] ?? 0) < 1) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '道具不足', message: '背包里没有金盏恢复剂。' })] }
        playerHealth = Math.min(state.stats.maxHealth, playerHealth + 10)
        inventory = { ...inventory, 'energy-tonic': inventory['energy-tonic'] - 1 }
        log.push('你使用金盏恢复剂，恢复 10 点生命。')
      }
      enemyHealth = Math.max(0, enemyHealth - damage)
      if (enemyHealth <= 0) return { ...state, stats: { ...state.stats, health: playerHealth, mana: playerMana }, inventory, battle: { ...battle, enemyHealth: 0, ended: 'victory', log: [...log, `${battle.enemyName}化作散落的灵光，战斗胜利。`] }, skills: { ...state.skills, combat: { ...state.skills.combat, experience: state.skills.combat.experience + 14 + battle.floor } } }
      const enemyDamage = action.action === 'defend' ? 2 : 5 + Math.floor(battle.floor / 4)
      playerHealth = Math.max(0, playerHealth - enemyDamage)
      log.push(action.action === 'defend' ? `你架起防御，只受到 ${enemyDamage} 点伤害。` : `${battle.enemyName}反击，造成 ${enemyDamage} 点伤害。`)
      return { ...state, stats: { ...state.stats, health: playerHealth, mana: playerMana }, inventory, battle: { ...battle, enemyHealth, turn: battle.turn + 1, ended: playerHealth <= 0 ? 'defeat' : undefined, log } }
    }
    case 'PLAYER_DEFEATED':
      return { ...state, day: state.day + 1, minutes: 6 * 60 + 30, location: 'farm', energy: state.maxEnergy, stats: { ...state.stats, health: state.stats.maxHealth, mana: state.stats.maxMana }, mine: { ...state.mine, currentFloor: 1 }, hospitalUsedToday: false, activeModal: null, battle: undefined, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '翌日苏醒', message: '你在农场床上醒来，精力、生命与魔力已经恢复。' })] }
    case 'START_FISHING':
      if (state.energy < 1) return { ...state, toasts: [...state.toasts, makeToast({ tone: 'warning', title: '精力不足', message: '需要 1 点精力才能抛竿。' })] }
      return { ...state, energy: state.energy - 1, fishing: { active: true } }
    case 'CATCH_FISH': {
      if (!state.fishing.active) return state
      if (action.result === 'silver-carp') return { ...state, fishing: { active: false, lastCatch: 'silver-carp' }, inventory: { ...state.inventory, 'silver-carp': (state.inventory['silver-carp'] ?? 0) + 1, 'reed-bait': Math.max(0, (state.inventory['reed-bait'] ?? 0) - 1) }, skills: { ...state.skills, fishing: { ...state.skills.fishing, experience: state.skills.fishing.experience + 16 } }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '钓到银鳞鲫', message: '钓鱼经验 +16，鱼获已放入背包。' })] }
      if (action.result === 'water-grass') return { ...state, fishing: { active: false, lastCatch: 'water-grass' }, inventory: { ...state.inventory, 'reed-bait': Math.max(0, (state.inventory['reed-bait'] ?? 0) - 1) }, skills: { ...state.skills, fishing: { ...state.skills.fishing, experience: state.skills.fishing.experience + 4 } } }
      return { ...state, fishing: { active: false, lastCatch: 'empty' }, inventory: { ...state.inventory, 'reed-bait': Math.max(0, (state.inventory['reed-bait'] ?? 0) - 1) } }
    }
    case 'UPGRADE_TOOL': {
      if (state.money < action.price || state.tools[action.tool] >= 4) return state
      return { ...state, money: state.money - action.price, tools: { ...state.tools, [action.tool]: state.tools[action.tool] + 1 }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '工具升级完成', message: '羽纹火花沿着新刃口亮起。' })] }
    }
    case 'REFINE_ORE':
      if ((state.inventory['copper-ore'] ?? 0) < 3) return state
      return { ...state, inventory: { ...state.inventory, 'copper-ore': state.inventory['copper-ore'] - 3, 'iron-ore': (state.inventory['iron-ore'] ?? 0) + 1 }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '精炼完成', message: '3 块铜矿石精炼为 1 块铁矿石。' })] }
    case 'BUY_PERMANENT_UPGRADE':
      if (state.money < action.price) return state
      return action.upgrade === 'energy'
        ? { ...state, money: state.money - action.price, maxEnergy: state.maxEnergy + 1, energy: state.energy + 1, toasts: [...state.toasts, makeToast({ tone: 'success', title: '精力上限提升', message: '最大精力永久增加 1 点。' })] }
        : { ...state, money: state.money - action.price, stats: { ...state.stats, maxMana: state.stats.maxMana + 3, mana: state.stats.mana + 3 }, toasts: [...state.toasts, makeToast({ tone: 'success', title: '魔力上限提升', message: '最大魔力永久增加 3 点。' })] }
    default:
      return state
  }
}
