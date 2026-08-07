import { describe, expect, it } from 'vitest'
import { npcs } from '../game/data'
import { DEFAULT_TAGS } from './types'
import { createMistvaleDefaults } from './defaults'

describe('雾灯谷酒馆默认内容', () => {
  it('创建完整且默认等待模型密钥的酒馆种子', () => {
    const defaults = createMistvaleDefaults()
    const comments = defaults.lorebooks.flatMap((book) => book.entries.map((entry) => entry.comment))

    expect(defaults.characters).toHaveLength(15)
    expect(defaults.characters.map((card) => card.npcId)).toEqual(npcs.map((npc) => npc.id))
    expect(defaults.characters.every((card) => card.id === `mistvale-character-${card.npcId}`)).toBe(true)
    expect(comments).toEqual(expect.arrayContaining(['五行克制', '每日精力', '地点营业']))
    expect(defaults.settings).not.toHaveProperty('adapterMode')
    expect(defaults.settings.api).toMatchObject({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      rememberKey: false,
    })
    expect(defaults.settings.api.persistedApiKey).toBeUndefined()
    expect(defaults.settings.customTags).toEqual([...DEFAULT_TAGS])
    expect(defaults.presets[0].settings).not.toHaveProperty('apiKey')
    expect(defaults.presets[0].description).toContain('模型')
    expect(defaults.presets[0].description).not.toContain('本地剧情引擎')
  })

  it('为角色卡绑定所在地、首句和世界书', () => {
    const defaults = createMistvaleDefaults()
    const loran = defaults.characters.find((card) => card.npcId === 'loran')

    expect(loran).toMatchObject({
      id: 'mistvale-character-loran',
      name: '洛岚',
      locationId: 'mayor-home',
    })
    expect(loran?.firstMessage).toContain('雾灯谷')
    expect(loran?.lorebookIds).toEqual(expect.arrayContaining(['mistvale-world-rules']))
  })
})
