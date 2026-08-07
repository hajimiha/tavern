import { createMistvaleDefaults } from './defaults'
import type { TavernApiConfig, TavernApiProvider, TavernSettings } from './types'

export type TavernApiFieldErrors = Partial<Record<'baseUrl' | 'model' | 'temperature' | 'maxTokens', string>>

const providerPresets: Record<TavernApiProvider, Pick<TavernApiConfig, 'provider' | 'baseUrl' | 'model'>> = {
  deepseek: {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
  'openai-compatible': {
    provider: 'openai-compatible',
    baseUrl: '',
    model: '',
  },
}

export function getTavernApiPreset(provider: TavernApiProvider) {
  return { ...providerPresets[provider] }
}

export function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export function validateTavernApiConfig(config: TavernApiConfig): TavernApiFieldErrors {
  const errors: TavernApiFieldErrors = {}
  const baseUrl = normalizeApiBaseUrl(config.baseUrl)
  try {
    const parsed = new URL(baseUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) errors.baseUrl = '接口地址必须使用 HTTP 或 HTTPS。'
  } catch {
    errors.baseUrl = '请输入完整的接口地址，例如 https://api.deepseek.com。'
  }
  if (!config.model.trim()) errors.model = '请填写要使用的模型名称。'
  if (!Number.isFinite(config.temperature) || config.temperature < 0 || config.temperature > 2) {
    errors.temperature = '温度必须在 0 到 2 之间。'
  }
  if (!Number.isInteger(config.maxTokens) || config.maxTokens < 64 || config.maxTokens > 8192) {
    errors.maxTokens = '最大输出长度必须是 64 到 8192 之间的整数。'
  }
  return errors
}

export function normalizeTavernSettings(value: unknown): TavernSettings {
  const defaults = createMistvaleDefaults().settings
  if (!value || typeof value !== 'object') return defaults
  const candidate = value as Partial<TavernSettings> & { adapterMode?: string; api?: Partial<TavernApiConfig> }
  const provider: TavernApiProvider = candidate.api?.provider === 'openai-compatible' ? 'openai-compatible' : 'deepseek'
  const preset = getTavernApiPreset(provider)
  const rememberKey = candidate.api?.rememberKey === true
  const api: TavernApiConfig = {
    ...defaults.api,
    ...preset,
    ...candidate.api,
    provider,
    baseUrl: typeof candidate.api?.baseUrl === 'string' ? normalizeApiBaseUrl(candidate.api.baseUrl) : preset.baseUrl,
    model: typeof candidate.api?.model === 'string' ? candidate.api.model.trim() : preset.model,
    temperature: typeof candidate.api?.temperature === 'number' && Number.isFinite(candidate.api.temperature)
      ? candidate.api.temperature
      : defaults.api.temperature,
    maxTokens: typeof candidate.api?.maxTokens === 'number' && Number.isFinite(candidate.api.maxTokens)
      ? Math.round(candidate.api.maxTokens)
      : defaults.api.maxTokens,
    rememberKey,
  }
  if (!rememberKey || !candidate.api?.persistedApiKey?.trim()) delete api.persistedApiKey
  else api.persistedApiKey = candidate.api.persistedApiKey.trim()

  return {
    ...defaults,
    ...candidate,
    key: 'mistvale-settings',
    adapterMode: candidate.adapterMode === 'remote' ? 'remote' : 'local',
    api,
    activeLorebookIds: Array.isArray(candidate.activeLorebookIds) ? candidate.activeLorebookIds : defaults.activeLorebookIds,
    customTags: Array.isArray(candidate.customTags) ? candidate.customTags : defaults.customTags,
  }
}
