import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GAME_RULES,
  calculateTradeTotal,
  canSpendEnergy,
  elementAdvantage,
  getEnergyCost,
  normalizeGameRules,
  scaleDamage,
  scaleGrowthHours,
  scaleReward,
} from './rules'

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

  it('规范化倍率边界、步进并安全回退', () => {
    expect(normalizeGameRules({
      experienceMultiplier: 8,
      affinityMultiplier: 0.61,
      dropMultiplier: Number.NaN,
      energyCostMode: 'invalid',
    })).toMatchObject({
      experienceMultiplier: 3,
      affinityMultiplier: 0.5,
      dropMultiplier: DEFAULT_GAME_RULES.dropMultiplier,
      energyCostMode: 'normal',
    })
  })

  it('统一缩放整数奖励、伤害、成长时间和精力成本', () => {
    expect(scaleReward(3, 1.5)).toBe(5)
    expect(scaleReward(1, 0.5)).toBe(1)
    expect(scaleDamage(5, 0.5)).toBe(3)
    expect(scaleGrowthHours(25, 2)).toBe(13)
    expect(getEnergyCost(1, 'free')).toBe(0)
    expect(getEnergyCost(1, 'normal')).toBe(1)
    expect(getEnergyCost(1, 'double')).toBe(2)
  })
})
