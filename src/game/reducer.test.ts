import { describe, expect, it } from 'vitest'
import { gameReducer, initialGameState } from './reducer'

describe('游戏状态变更', () => {
  it('以刚抵达小镇的新手数据开始游戏', () => {
    expect(initialGameState).toMatchObject({
      day: 1,
      season: '春',
      weekday: '周一',
      minutes: 6 * 60 + 30,
      location: 'farm',
      money: 500,
      energy: 5,
      maxEnergy: 5,
    })
    expect(initialGameState.inventory).toEqual({
      'moon-radish-seed': 8,
      'mist-bean-seed': 4,
    })
    expect(initialGameState.plots).toHaveLength(24)
    expect(initialGameState.plots.every((plot) => !plot.cropId && !plot.ready)).toBe(true)
    expect(Object.values(initialGameState.skills).every((skill) => skill.level === 1 && skill.experience === 0)).toBe(true)
    expect(Object.values(initialGameState.relationships).every((relationship) => (
      relationship.affinity === 0
      && relationship.stage === 'stranger'
      && relationship.memoryTags.length === 0
    ))).toBe(true)
    expect(initialGameState.quests.every((quest) => quest.status === 'available')).toBe(true)
    expect(initialGameState.knownSpells).toEqual([])
    expect(initialGameState.mine).toEqual({ currentFloor: 1, highestFloor: 1, unlockedElevators: [] })
  })

  it('合法行动消耗指定精力', () => {
    const next = gameReducer(initialGameState, {
      type: 'SPEND_ENERGY',
      amount: 1,
      reason: '钓鱼',
    })

    expect(next.energy).toBe(4)
  })

  it('精力不足时不产生负数并创建内部警告', () => {
    const next = gameReducer(
      { ...initialGameState, energy: 0, toasts: [] },
      { type: 'SPEND_ENERGY', amount: 1, reason: '聊天' },
    )

    expect(next.energy).toBe(0)
    expect(next.toasts.at(-1)?.message).toBe('精力不足，无法聊天')
    expect(next.toasts.at(-1)?.tone).toBe('warning')
  })
})
