import { afterEach, describe, expect, it } from 'vitest'
import { createMistvaleDefaults } from './defaults'
import { clearSessionApiKey, resolveApiKey, setSessionApiKey } from './api-credentials'

afterEach(() => clearSessionApiKey())

describe('酒馆 API 密钥', () => {
  it('优先使用仅存在当前标签会话的密钥', () => {
    const settings = createMistvaleDefaults().settings
    setSessionApiKey('session-secret')

    expect(resolveApiKey({
      ...settings,
      api: { ...settings.api, rememberKey: true, persistedApiKey: 'saved-secret' },
    })).toBe('session-secret')
  })

  it('只在玩家明确选择记住时读取本机持久密钥', () => {
    const settings = createMistvaleDefaults().settings

    expect(resolveApiKey({
      ...settings,
      api: { ...settings.api, rememberKey: false, persistedApiKey: 'should-ignore' },
    })).toBe('')
    expect(resolveApiKey({
      ...settings,
      api: { ...settings.api, rememberKey: true, persistedApiKey: 'saved-secret' },
    })).toBe('saved-secret')
  })
})
