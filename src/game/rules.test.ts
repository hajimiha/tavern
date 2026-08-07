import { describe, expect, it } from 'vitest'
import { calculateTradeTotal, canSpendEnergy, elementAdvantage } from './rules'

describe('游戏规则', () => {
  it('在精力不足时阻止行动并给出原因', () => {
    expect(canSpendEnergy({ energy: 0 }, 1)).toEqual({
      allowed: false,
      reason: '精力不足',
    })
  })

  it('按单价和数量计算交易总额', () => {
    expect(calculateTradeTotal(65, 3)).toBe(195)
  })

  it('按五行相克计算伤害倍率', () => {
    expect(elementAdvantage('water', 'fire')).toBe(1.5)
    expect(elementAdvantage('fire', 'water')).toBe(0.75)
    expect(elementAdvantage('wood', 'water')).toBe(1)
  })
})
