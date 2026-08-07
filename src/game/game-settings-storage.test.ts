import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_GAME_RULES } from './rules'
import { GAME_RULES_STORAGE_KEY, loadGameRules, saveGameRules } from './game-settings-storage'

describe('游戏规则本机持久化', () => {
  beforeEach(() => localStorage.clear())

  it('没有记录或记录损坏时回退到标准规则', () => {
    expect(loadGameRules()).toEqual(DEFAULT_GAME_RULES)
    localStorage.setItem(GAME_RULES_STORAGE_KEY, '{bad json')
    expect(loadGameRules()).toEqual(DEFAULT_GAME_RULES)
  })

  it('保存时规范化规则且只写规则子树', () => {
    saveGameRules({ ...DEFAULT_GAME_RULES, dropMultiplier: 2.12 })
    expect(loadGameRules().dropMultiplier).toBe(2)
    expect(JSON.parse(localStorage.getItem(GAME_RULES_STORAGE_KEY) ?? '{}')).not.toHaveProperty('money')
  })
})
