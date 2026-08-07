import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { MistvaleTavernDatabase } from './database'
import { createTavernDatabase } from './database'
import { createTavernRepository } from './repository'
import { createContentPack } from './content-pack'
import { createMistvaleDefaults } from './defaults'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
  if (!database) return
  database.close()
  await database.delete()
  database = undefined
})

describe('雾灯谷酒馆仓储', () => {
  it('仅为空表写入默认内容，保留玩家修改', async () => {
    database = createTavernDatabase(`mistvale-test-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)
    await repository.initialize()

    const characters = await repository.listCharacters()
    expect(characters).toHaveLength(15)
    const edited = { ...characters[0], personality: '玩家自定义性格', updatedAt: Date.now() + 1 }
    await repository.saveCharacter(edited)

    await repository.initialize()
    expect((await repository.getCharacter(edited.id))?.personality).toBe('玩家自定义性格')
    expect(await repository.listLorebooks()).toHaveLength(2)
    const settings = await repository.getSettings()
    expect(settings).not.toHaveProperty('adapterMode')
    expect(settings.api.model).toBe('deepseek-v4-flash')
  })

  it('读取旧版设置时补全 API 配置且不会凭空保存密钥', async () => {
    database = createTavernDatabase(`mistvale-migration-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)
    await repository.initialize()
    const current = await database.settings.get('mistvale-settings')
    await database.settings.put({ ...current!, adapterMode: 'disabled', api: undefined } as never)

    const migrated = await repository.getSettings()

    expect(migrated).not.toHaveProperty('adapterMode')
    expect(migrated.api).toMatchObject({ provider: 'deepseek', model: 'deepseek-v4-flash' })
    expect(migrated.api.persistedApiKey).toBeUndefined()
  })

  it('为世界书和会话提供对称的保存与删除操作', async () => {
    database = createTavernDatabase(`mistvale-test-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)
    await repository.initialize()

    const book = (await repository.listLorebooks())[0]
    await repository.saveLorebook({ ...book, name: '改名后的世界书' })
    expect((await repository.getLorebook(book.id))?.name).toBe('改名后的世界书')
    await repository.deleteLorebook(book.id)
    expect(await repository.getLorebook(book.id)).toBeUndefined()

    const now = Date.now()
    await repository.saveSession({
      id: 'session-test',
      name: '测试会话',
      messages: [],
      characterName: '洛岚',
      userName: '旅行者',
      presetId: null,
      lorebookIds: [],
      variables: {},
      createdAt: now,
      updatedAt: now,
    })
    expect(await repository.getSession('session-test')).toBeDefined()
    await repository.deleteSession('session-test')
    expect(await repository.getSession('session-test')).toBeUndefined()
  })

  it('仓库内容包仅在版本升级时更新同 ID 默认内容并保留本机新增内容', async () => {
    database = createTavernDatabase(`mistvale-content-pack-${crypto.randomUUID()}`)
    const defaults = createMistvaleDefaults()
    const card = defaults.characters[0]
    const packV1 = createContentPack({
      contentVersion: 'v1', lorebooks: [], presets: [], characters: [{ ...card, personality: '仓库版本一' }],
    })
    const repositoryV1 = createTavernRepository(database, async () => packV1)
    await repositoryV1.initialize()
    expect((await repositoryV1.getCharacter(card.id))?.personality).toBe('仓库版本一')

    await repositoryV1.saveCharacter({ ...card, personality: '本机修改', updatedAt: Date.now() + 10 })
    await repositoryV1.saveCharacter({ ...card, id: 'local-custom-character', personality: '本机新增', updatedAt: Date.now() + 11 })
    await repositoryV1.initialize()
    expect((await repositoryV1.getCharacter(card.id))?.personality).toBe('本机修改')

    const packV2 = createContentPack({
      contentVersion: 'v2', lorebooks: [], presets: [], characters: [{ ...card, personality: '仓库版本二' }],
    })
    const repositoryV2 = createTavernRepository(database, async () => packV2)
    await repositoryV2.initialize()
    expect((await repositoryV2.getCharacter(card.id))?.personality).toBe('仓库版本二')
    expect((await repositoryV2.getCharacter('local-custom-character'))?.personality).toBe('本机新增')
  })
})
