import { describe, expect, it } from 'vitest'
import { gameReducer, initialGameState } from './reducer'

describe('游戏状态变更', () => {
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
