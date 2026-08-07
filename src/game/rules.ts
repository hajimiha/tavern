import type { ElementType, EnergyCostMode, GameRuleSettings } from './types'

export const DEFAULT_GAME_RULES: GameRuleSettings = Object.freeze({
  experienceMultiplier: 1,
  affinityMultiplier: 1,
  dropMultiplier: 1,
  moneyMultiplier: 1,
  cropGrowthMultiplier: 1,
  playerDamageMultiplier: 1,
  enemyDamageMultiplier: 1,
  recoveryMultiplier: 1,
  energyCostMode: 'normal',
})

const multiplierKeys = [
  'experienceMultiplier',
  'affinityMultiplier',
  'dropMultiplier',
  'moneyMultiplier',
  'cropGrowthMultiplier',
  'playerDamageMultiplier',
  'enemyDamageMultiplier',
  'recoveryMultiplier',
] as const

function normalizeMultiplier(value: unknown, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const clamped = Math.min(3, Math.max(0.5, value))
  return Math.round(clamped * 4) / 4
}

export function normalizeGameRules(value?: unknown): GameRuleSettings {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const normalized = { ...DEFAULT_GAME_RULES }
  multiplierKeys.forEach((key) => {
    normalized[key] = normalizeMultiplier(source[key], DEFAULT_GAME_RULES[key])
  })
  normalized.energyCostMode = source.energyCostMode === 'free' || source.energyCostMode === 'double'
    ? source.energyCostMode
    : 'normal'
  return normalized
}

export function scaleReward(base: number, multiplier: number) {
  if (base <= 0) return 0
  return Math.max(1, Math.round(base * multiplier))
}

export function scaleDamage(base: number, multiplier: number) {
  return scaleReward(base, multiplier)
}

export function scaleGrowthHours(base: number, multiplier: number) {
  if (base <= 0) return 0
  return Math.max(1, Math.ceil(base / multiplier))
}

export function getEnergyCost(base: number, mode: EnergyCostMode) {
  if (base <= 0 || mode === 'free') return 0
  return mode === 'double' ? base * 2 : base
}

export function canSpendEnergy(state: { energy: number }, amount: number) {
  if (amount <= 0) return { allowed: true as const }
  if (state.energy < amount) return { allowed: false as const, reason: '精力不足' }
  return { allowed: true as const }
}

export function calculateTradeTotal(price: number, quantity: number) {
  return Math.max(0, Math.floor(price)) * Math.max(0, Math.floor(quantity))
}

const beats: Record<ElementType, ElementType> = {
  metal: 'wood',
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
}

export function elementAdvantage(attacker: ElementType, defender: ElementType) {
  if (beats[attacker] === defender) return 1.5
  if (beats[defender] === attacker) return 0.75
  return 1
}
