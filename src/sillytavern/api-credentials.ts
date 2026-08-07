import type { TavernSettings } from './types'

const SESSION_API_KEY = 'mistvale:tavern-api-key'
let memoryApiKey = ''

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function getSessionApiKey(): string {
  return getSessionStorage()?.getItem(SESSION_API_KEY)?.trim() || memoryApiKey
}

export function setSessionApiKey(value: string): void {
  memoryApiKey = value.trim()
  const storage = getSessionStorage()
  if (!storage) return
  if (memoryApiKey) storage.setItem(SESSION_API_KEY, memoryApiKey)
  else storage.removeItem(SESSION_API_KEY)
}

export function clearSessionApiKey(): void {
  setSessionApiKey('')
}

export function resolveApiKey(settings: TavernSettings): string {
  return getSessionApiKey() || (settings.api.rememberKey ? settings.api.persistedApiKey?.trim() || '' : '')
}
