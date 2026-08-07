import 'fake-indexeddb/auto'
import '../../test/setup'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { npcs } from '../../game/data'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { createTavernDatabase, type MistvaleTavernDatabase } from '../../sillytavern/database'
import { createTavernRepository } from '../../sillytavern/repository'
import { TavernProvider } from '../../tavern/TavernContext'
import { TavernDialogue } from './TavernDialogue'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
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
    expect(screen.getByText('接口已预留 · 当前使用本地叙事')).toBeVisible()
    const action = await screen.findByRole('button', { name: /选择行动：询问今日委托/ })
    await waitFor(() => expect(action).toBeEnabled())
    expect(saveSessionSpy).toHaveBeenCalledTimes(1)
    await user.click(action)
    await waitFor(() => expect(saveSessionSpy).toHaveBeenCalledTimes(2))
    await waitFor(async () => expect((await repository.listSessions())[0]?.messages).toHaveLength(3))
    expect(await screen.findByText(/村庄会记得/)).toBeVisible()
  })
})
