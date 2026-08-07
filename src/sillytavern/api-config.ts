import { createMistvaleDefaults } from './defaults'
import { getTavernProvider, isTavernApiProvider } from './provider-registry'
import type { TavernApiConfig, TavernApiProvider, TavernProviderOptionKey, TavernSettings } from './types'

export type TavernApiFieldErrors = Partial<Record<'baseUrl' | 'model' | 'temperature' | 'maxTokens' | TavernProviderOptionKey, string>>

export function getTavernApiPreset(provider: TavernApiProvider) {
  const definition = getTavernProvider(provider)
  return { provider, baseUrl: definition.baseUrl, model: definition.defaultModel, providerOptions: {} }
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
  const provider = getTavernProvider(config.provider)
  for (const option of provider.requiredOptions) {
    if (!config.providerOptions[option]?.trim()) errors[option] = `请填写${option === 'accountId' ? ' Account ID' : option === 'projectId' ? '项目 ID' : '区域'}。`
  }
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
  const provider: TavernApiProvider = isTavernApiProvider(candidate.api?.provider) ? candidate.api.provider : 'deepseek'
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
    providerOptions: candidate.api?.providerOptions && typeof candidate.api.providerOptions === 'object'
      ? Object.fromEntries(Object.entries(candidate.api.providerOptions).map(([key, option]) => [key, typeof option === 'string' ? option.trim() : '']))
      : {},
  }
  if (!rememberKey || !candidate.api?.persistedApiKey?.trim()) delete api.persistedApiKey
  else api.persistedApiKey = candidate.api.persistedApiKey.trim()

  const { adapterMode: _legacyAdapterMode, ...safeCandidate } = candidate
  return {
    ...defaults,
    ...safeCandidate,
    key: 'mistvale-settings',
    api,
    activeLorebookIds: Array.isArray(candidate.activeLorebookIds) ? candidate.activeLorebookIds : defaults.activeLorebookIds,
    customTags: Array.isArray(candidate.customTags) ? candidate.customTags : defaults.customTags,
  }
}
