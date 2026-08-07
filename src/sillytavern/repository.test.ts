import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import type { MistvaleTavernDatabase } from './database'
import { createTavernDatabase } from './database'
import { createTavernRepository } from './repository'

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
    expect((await repository.getSettings()).adapterMode).toBe('disabled')
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
})
