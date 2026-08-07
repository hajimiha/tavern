import type { ElementType } from './types'

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
