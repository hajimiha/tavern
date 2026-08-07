import '../../test/setup'
import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { LocationStage } from '../stage/LocationStage'
import { createTavernDatabase, type MistvaleTavernDatabase } from '../../sillytavern/database'
import { createTavernRepository } from '../../sillytavern/repository'
import { TavernProvider } from '../../tavern/TavernContext'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
  if (!database) return
  database.close()
  await database.delete()
  database = undefined
})

describe('NPC 关系与灵犀对话', () => {
  it('从洛岚的立绘进入五类互动并打开对话', async () => {
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-npc-${crypto.randomUUID()}`)
    render(
      <GameProvider initialState={{ ...initialGameState, location: 'mayor-home' }}>
        <TavernProvider repository={createTavernRepository(database)}><LocationStage /></TavernProvider>
      </GameProvider>,
    )

    await user.click(screen.getByRole('button', { name: '与村长洛岚互动' }))
    expect(screen.getByRole('dialog', { name: '洛岚互动面板' })).toBeVisible()
    expect(screen.getAllByRole('button', { name: /交谈|赠礼|交易|提交任务|人物档案/ })).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: '与洛岚交谈' }))
    expect(screen.getByRole('dialog', { name: '与洛岚的酒馆会话' })).toBeVisible()
    expect(screen.getByText(/本地叙事 · 不发送网络请求/)).toBeVisible()
  })
})
