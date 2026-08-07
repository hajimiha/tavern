import 'fake-indexeddb/auto'
import '../../test/setup'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { npcs } from '../../game/data'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { createTavernDatabase, type MistvaleTavernDatabase } from '../../sillytavern/database'
import { clearSessionApiKey, setSessionApiKey } from '../../sillytavern/api-credentials'
import { createTavernRepository } from '../../sillytavern/repository'
import { TavernProvider } from '../../tavern/TavernContext'
import { TavernDialogue } from './TavernDialogue'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
  clearSessionApiKey()
  vi.unstubAllGlobals()
  if (!database) return
  database.close()
  await database.delete()
  database = undefined
})

describe('NPC 酒馆会话', () => {
  it('展示角色卡、历史入口、本地状态和结构化行动', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-dialogue-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)
    const saveSessionSpy = vi.spyOn(repository, 'saveSession')
    const loran = npcs.find((npc) => npc.id === 'loran')!

    render(
      <GameProvider initialState={{ ...initialGameState, location: 'mayor-home' }}>
        <TavernProvider repository={repository}>
          <TavernDialogue npc={loran} />
        </TavernProvider>
      </GameProvider>,
    )

    expect(await screen.findByRole('heading', { name: '与洛岚的酒馆会话' })).toBeVisible()
    expect(screen.getByRole('button', { name: '查看会话历史' })).toBeVisible()
    expect(screen.getByText('本地叙事 · 不发送网络请求')).toBeVisible()
    const action = await screen.findByRole('button', { name: /选择行动：询问今日委托/ })
    await waitFor(() => expect(action).toBeEnabled())
    expect(saveSessionSpy).toHaveBeenCalledTimes(1)
    await user.click(action)
    await waitFor(() => expect(saveSessionSpy).toHaveBeenCalledTimes(2))
    await waitFor(async () => expect((await repository.listSessions())[0]?.messages).toHaveLength(3))
    expect(await screen.findByText(/村庄会记得/)).toBeVisible()
  })

  it('远程模式使用配置的模型生成并保存 NPC 互动文字', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const response = [
      '<maintext>洛岚翻开空白委托簿，说今天先熟悉村庄就好。</maintext>',
      '<option>询问村庄路线\n聊聊自己的农场</option>',
      '<sum>洛岚建议新玩家先熟悉村庄。</sum>',
      '<vars>{}</vars>',
    ].join('')
    const fetchMock = vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: response } }] })}\n\ndata: [DONE]\n\n`, {
      headers: { 'content-type': 'text/event-stream' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    setSessionApiKey('session-secret')
    database = createTavernDatabase(`mistvale-remote-dialogue-${crypto.randomUUID()}`)
    const repository = createTavernRepository(database)
    await repository.initialize()
    const settings = await repository.getSettings()
    await repository.saveSettings({ ...settings, adapterMode: 'remote' })
    const loran = npcs.find((npc) => npc.id === 'loran')!
    const user = userEvent.setup()

    render(
      <GameProvider initialState={{ ...initialGameState, location: 'mayor-home' }}>
        <TavernProvider repository={repository}>
          <TavernDialogue npc={loran} />
        </TavernProvider>
      </GameProvider>,
    )

    const action = await screen.findByRole('button', { name: /选择行动：询问今日委托/ })
    await waitFor(() => expect(action).toBeEnabled())
    await user.click(action)

    expect(await screen.findByText('洛岚翻开空白委托簿，说今天先熟悉村庄就好。')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/chat/completions', expect.any(Object))
    expect((await repository.listSessions())[0].messages.at(-1)).toMatchObject({
      content: '洛岚翻开空白委托簿，说今天先熟悉村庄就好。',
      apiUsed: 'remote',
    })
  })
})
