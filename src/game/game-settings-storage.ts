import { DEFAULT_GAME_RULES, normalizeGameRules } from './rules'
import type { GameRuleSettings } from './types'

export const GAME_RULES_STORAGE_KEY = 'mistvale-game-rules-v1'

function browserStorage() {
  if (typeof window === 'undefined') return undefined
  try { return window.localStorage } catch { return undefined }
}

export function loadGameRules(storage: Storage | undefined = browserStorage()): GameRuleSettings {
  if (!storage) return { ...DEFAULT_GAME_RULES }
  try {
    const saved = storage.getItem(GAME_RULES_STORAGE_KEY)
    return saved ? normalizeGameRules(JSON.parse(saved)) : { ...DEFAULT_GAME_RULES }
  } catch {
    return { ...DEFAULT_GAME_RULES }
  }
}

export function saveGameRules(rules: GameRuleSettings, storage: Storage | undefined = browserStorage()) {
  if (!storage) return
  try {
    storage.setItem(GAME_RULES_STORAGE_KEY, JSON.stringify(normalizeGameRules(rules)))
  } catch {
    // 浏览器隐私模式或配额限制不应中断游戏。
  }
}
