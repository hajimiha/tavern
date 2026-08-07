import { describe, expect, it } from 'vitest'
import { createMistvaleDefaults } from './defaults'
import { getTavernApiPreset, normalizeTavernSettings, validateTavernApiConfig } from './api-config'

describe('酒馆 API 配置', () => {
  it('将旧版禁用设置迁移为完整的本地模式配置', () => {
    const defaults = createMistvaleDefaults().settings
    const legacy = {
      ...defaults,
      adapterMode: 'disabled',
      api: undefined,
    }

    const normalized = normalizeTavernSettings(legacy)

    expect(normalized.adapterMode).toBe('local')
    expect(normalized.api).toMatchObject({
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      temperature: 0.8,
      maxTokens: 1200,
      rememberKey: false,
    })
  })

  it('提供 DeepSeek 与自定义兼容服务预设', () => {
    expect(getTavernApiPreset('deepseek')).toMatchObject({
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
    })
    expect(getTavernApiPreset('openai-compatible')).toMatchObject({
      baseUrl: '',
      model: '',
    })
  })

  it('对缺失端点、模型和越界参数给出字段级错误', () => {
    const errors = validateTavernApiConfig({
      provider: 'openai-compatible',
      baseUrl: 'not-a-url',
      model: '',
      temperature: 3,
      maxTokens: 20,
      rememberKey: false,
    })

    expect(errors).toMatchObject({
      baseUrl: expect.any(String),
      model: expect.any(String),
      temperature: expect.any(String),
      maxTokens: expect.any(String),
    })
  })
})
