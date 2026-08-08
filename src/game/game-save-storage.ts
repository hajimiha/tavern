import { locations, spells } from './data'
import { getSeasonForDay, getWeekday } from './calendar'
import { initialGameState } from './reducer'
import { normalizeGameRules } from './rules'
import type { AffinityStage, GameState, LocationId, Relationship, SkillId } from './types'

export const GAME_SAVE_STORAGE_KEY = 'mistvale-game-save-v1'
export const GAME_SAVE_SCHEMA_VERSION = 1 as const

export interface GameSaveEnvelope {
  schemaVersion: typeof GAME_SAVE_SCHEMA_VERSION
  savedAt: number
  state: GameState
}

export function getBrowserGameStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeGameState(value: Partial<GameState>): GameState {
  const number = (candidate: unknown, fallback: number, minimum = 0) =>
    typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= minimum ? candidate : fallback
  const integer = (candidate: unknown, fallback: number, minimum = 0) => Math.floor(number(candidate, fallback, minimum))
  const boolean = (candidate: unknown, fallback: boolean) => typeof candidate === 'boolean' ? candidate : fallback
  const stringList = (candidate: unknown) => Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === 'string').slice(0, 200)
    : []

  const validLocations = new Set(locations.map((location) => location.id))
  const location = validLocations.has(value.location as LocationId) ? value.location as LocationId : initialGameState.location
  const maxEnergy = integer(value.maxEnergy, initialGameState.maxEnergy, 1)
  const rawStats: Record<string, unknown> = isObject(value.stats) ? value.stats : {}
  const maxHealth = integer(rawStats.maxHealth, initialGameState.stats.maxHealth, 1)
  const maxMana = integer(rawStats.maxMana, initialGameState.stats.maxMana, 1)

  const skillIds = Object.keys(initialGameState.skills) as SkillId[]
  const rawSkills: Record<string, unknown> = isObject(value.skills) ? value.skills : {}
  const skills = Object.fromEntries(skillIds.map((id) => {
    const fallback = initialGameState.skills[id]
    const raw: Record<string, unknown> = isObject(rawSkills[id]) ? rawSkills[id] : {}
    return [id, {
      level: integer(raw.level, fallback.level, 1),
      experience: integer(raw.experience, fallback.experience),
      nextLevel: integer(raw.nextLevel, fallback.nextLevel, 1),
    }]
  })) as GameState['skills']

  const inventory = Object.fromEntries(Object.entries(isObject(value.inventory) ? value.inventory : {})
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0)
    .map(([id, amount]) => [id, Math.floor(amount)]))

  const rawPlots = Array.isArray(value.plots) ? value.plots : []
  const plots = initialGameState.plots.map((fallback) => {
    const raw = rawPlots.find((plot) => isObject(plot) && plot.id === fallback.id)
    if (!isObject(raw)) return { ...fallback }
    const cropId = typeof raw.cropId === 'string' ? raw.cropId : undefined
    return {
      ...fallback,
      ...(cropId ? { cropId } : {}),
      ...(typeof raw.plantedAt === 'number' && Number.isFinite(raw.plantedAt) && raw.plantedAt >= 0 ? { plantedAt: raw.plantedAt } : {}),
      ...(typeof raw.remainingHours === 'number' && Number.isFinite(raw.remainingHours) && raw.remainingHours >= 0 ? { remainingHours: raw.remainingHours } : {}),
      watered: boolean(raw.watered, fallback.watered),
      fertilized: boolean(raw.fertilized, fallback.fertilized),
      ready: boolean(raw.ready, fallback.ready),
    }
  })

  const affinityStages = new Set<AffinityStage>(['stranger', 'acquainted', 'trusted', 'intimate', 'bonded'])
  const rawRelationships: Record<string, unknown> = isObject(value.relationships) ? value.relationships : {}
  const relationships = Object.fromEntries(Object.entries(initialGameState.relationships).map(([id, fallback]) => {
    const raw: Record<string, unknown> = isObject(rawRelationships[id]) ? rawRelationships[id] : {}
    const relationship: Relationship = {
      affinity: integer(raw.affinity, fallback.affinity),
      stage: affinityStages.has(raw.stage as AffinityStage) ? raw.stage as AffinityStage : fallback.stage,
      chattedToday: boolean(raw.chattedToday, fallback.chattedToday),
      giftedToday: boolean(raw.giftedToday, fallback.giftedToday),
      memoryTags: stringList(raw.memoryTags),
    }
    return [id, relationship]
  })) as GameState['relationships']

  const rawQuests = Array.isArray(value.quests) ? value.quests : []
  const questStatuses = new Set(['available', 'active', 'ready', 'completed'])
  const quests = initialGameState.quests.map((fallback) => {
    const raw = rawQuests.find((quest) => isObject(quest) && quest.id === fallback.id)
    return { ...fallback, status: isObject(raw) && questStatuses.has(String(raw.status)) ? raw.status as typeof fallback.status : fallback.status }
  })

  const rawMine: Record<string, unknown> = isObject(value.mine) ? value.mine : {}
  const highestFloor = integer(rawMine.highestFloor, initialGameState.mine.highestFloor, 1)
  const currentFloor = Math.min(integer(rawMine.currentFloor, initialGameState.mine.currentFloor, 1), highestFloor)
  const unlockedElevators = Array.isArray(rawMine.unlockedElevators)
    ? [...new Set(rawMine.unlockedElevators.filter((floor: unknown): floor is number => typeof floor === 'number' && Number.isInteger(floor) && floor > 0 && floor <= highestFloor && floor % 5 === 0))]
    : []

  const rawTools: Record<string, unknown> = isObject(value.tools) ? value.tools : {}
  const toolLevel = (candidate: unknown, fallback: number) => Math.min(4, integer(candidate, fallback, 1))
  const rawFishing: Record<string, unknown> = isObject(value.fishing) ? value.fishing : {}
  const knownSpellIds = new Set(spells.map((spell) => spell.id))
  const year = integer(value.year, initialGameState.year, 1)
  const day = Math.min(365, integer(value.day, initialGameState.day, 1))

  return {
    ...initialGameState,
    year,
    day,
    season: getSeasonForDay(day),
    weekday: getWeekday(year, day),
    minutes: Math.min(1439, integer(value.minutes, initialGameState.minutes)),
    weather: (['薄雾', '晴', '雨'] as const).includes(value.weather as GameState['weather']) ? value.weather as GameState['weather'] : initialGameState.weather,
    location,
    energy: Math.min(integer(value.energy, initialGameState.energy), maxEnergy),
    maxEnergy,
    money: integer(value.money, initialGameState.money),
    rules: normalizeGameRules(isObject(value.rules) ? value.rules : initialGameState.rules),
    skills,
    stats: {
      health: Math.min(integer(rawStats.health, initialGameState.stats.health), maxHealth),
      maxHealth,
      attack: integer(rawStats.attack, initialGameState.stats.attack),
      mana: Math.min(integer(rawStats.mana, initialGameState.stats.mana), maxMana),
      maxMana,
      magicDamage: integer(rawStats.magicDamage, initialGameState.stats.magicDamage),
    },
    inventory,
    plots,
    relationships,
    quests,
    knownSpells: stringList(value.knownSpells).filter((id) => knownSpellIds.has(id)),
    mine: { currentFloor, highestFloor, unlockedElevators },
    hospitalUsedToday: boolean(value.hospitalUsedToday, initialGameState.hospitalUsedToday),
    ownsMonsterRanch: boolean(value.ownsMonsterRanch, initialGameState.ownsMonsterRanch),
    battle: undefined,
    tools: {
      hoe: toolLevel(rawTools.hoe, initialGameState.tools.hoe),
      rod: toolLevel(rawTools.rod, initialGameState.tools.rod),
      pickaxe: toolLevel(rawTools.pickaxe, initialGameState.tools.pickaxe),
    },
    fishing: {
      active: false,
      ...(typeof rawFishing.lastCatch === 'string' ? { lastCatch: rawFishing.lastCatch } : {}),
    },
    activeModal: null,
    selectedNpcId: undefined,
    selectedPlotId: undefined,
    toasts: [],
  }
}

export function createGameSaveEnvelope(state: GameState, savedAt = Date.now()): GameSaveEnvelope {
  return { schemaVersion: GAME_SAVE_SCHEMA_VERSION, savedAt, state: sanitizeGameState(state) }
}

export function serializeGameSave(state: GameState, savedAt = Date.now()): string {
  return JSON.stringify(createGameSaveEnvelope(state, savedAt), null, 2)
}

export function parseGameSave(raw: string): GameSaveEnvelope | null {
  try {
    const candidate = JSON.parse(raw) as unknown
    if (!isObject(candidate) || candidate.schemaVersion !== GAME_SAVE_SCHEMA_VERSION || !isObject(candidate.state)) return null
    const savedAt = typeof candidate.savedAt === 'number' && Number.isFinite(candidate.savedAt) ? candidate.savedAt : Date.now()
    return { schemaVersion: GAME_SAVE_SCHEMA_VERSION, savedAt, state: sanitizeGameState(candidate.state as Partial<GameState>) }
  } catch {
    return null
  }
}

export function loadGameSave(storage: Storage | undefined = getBrowserGameStorage()): GameSaveEnvelope | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(GAME_SAVE_STORAGE_KEY)
    return raw ? parseGameSave(raw) : null
  } catch {
    return null
  }
}

export function saveGameState(state: GameState, storage: Storage | undefined = getBrowserGameStorage(), savedAt = Date.now()): GameSaveEnvelope | null {
  if (!storage) return null
  const envelope = createGameSaveEnvelope(state, savedAt)
  try {
    storage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify(envelope))
    return envelope
  } catch {
    return null
  }
}

export function clearGameSave(storage: Storage | undefined = getBrowserGameStorage()): void {
  try { storage?.removeItem(GAME_SAVE_STORAGE_KEY) } catch { /* 保持当前会话可玩 */ }
}
