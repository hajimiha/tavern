import { describe, expect, it } from 'vitest'
import { createMistvaleDefaults } from './defaults'
import { getTavernApiPreset, normalizeTavernSettings, validateTavernApiConfig } from './api-config'

describe('酒馆 API 配置', () => {
  it('将旧版禁用或本地设置迁移为强制在线模型配置', () => {
    const defaults = createMistvaleDefaults().settings
    const legacy = {
      ...defaults,
      adapterMode: 'disabled',
      api: undefined,
    }

    const normalized = normalizeTavernSettings(legacy)

    expect(normalized).not.toHaveProperty('adapterMode')
    expect(normalized.api).toMatchObject({
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      temperature: 0.8,
      contextLength: 32000,
      maxResponseLength: 1200,
      streaming: true,
      frequencyPenalty: 0,
      presencePenalty: 0,
      topP: 0.9,
      rememberKey: false,
    })
  })

  it('将旧 maxTokens 迁移为无硬上限的最大回复长度', () => {
    const defaults = createMistvaleDefaults().settings
    const normalized = normalizeTavernSettings({
      ...defaults,
      api: { ...defaults.api, maxTokens: 64000, maxResponseLength: undefined },
    })

    expect(normalized.api.maxResponseLength).toBe(64000)
    expect(validateTavernApiConfig({ ...normalized.api, contextLength: 200000, maxResponseLength: 128000 })).not.toHaveProperty('maxResponseLength')
  })

  it('提供 DeepSeek、Claude 与自定义兼容服务预设', () => {
    expect(getTavernApiPreset('deepseek')).toMatchObject({
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
    })
    expect(getTavernApiPreset('openai-compatible')).toMatchObject({
      baseUrl: '',
      model: '',
    })
    expect(getTavernApiPreset('claude')).toMatchObject({
      baseUrl: 'https://api.anthropic.com',
      model: expect.any(String),
    })
  })

  it('对缺失端点、模型和越界参数给出字段级错误', () => {
    const errors = validateTavernApiConfig({
      provider: 'openai-compatible',
      baseUrl: 'not-a-url',
      model: '',
      temperature: 3,
      contextLength: 0,
      maxResponseLength: 0,
      streaming: true,
      frequencyPenalty: -3,
      presencePenalty: 3,
      topP: 2,
      rememberKey: false,
      providerOptions: {},
    })

    expect(errors).toMatchObject({
      baseUrl: expect.any(String),
      model: expect.any(String),
      temperature: expect.any(String),
      contextLength: expect.any(String),
      maxResponseLength: expect.any(String),
      frequencyPenalty: expect.any(String),
      presencePenalty: expect.any(String),
      topP: expect.any(String),
    })
  })
})
