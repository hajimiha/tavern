import 'fake-indexeddb/auto'
import '../../test/setup'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { createTavernDatabase, type MistvaleTavernDatabase } from '../../sillytavern/database'
import { createTavernRepository } from '../../sillytavern/repository'
import { TavernProvider } from '../../tavern/TavernContext'
import { TavernHubModal } from './TavernHubModal'

let database: MistvaleTavernDatabase | undefined

afterEach(async () => {
  if (!database) return
  database.close()
  await database.delete()
  database = undefined
})

describe('酒馆中枢', () => {
  it('提供六个可键盘切换的酒馆管理标签与真实接口入口', async () => {
    const user = userEvent.setup()
    database = createTavernDatabase(`mistvale-hub-${crypto.randomUUID()}`)
    render(
      <GameProvider>
        <TavernProvider repository={createTavernRepository(database)}>
          <TavernHubModal onClose={() => undefined} />
        </TavernProvider>
      </GameProvider>,
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(6)
    expect(screen.getByRole('tab', { name: '接口' })).toHaveAttribute('id', 'tavern-tab-api')
    expect(await screen.findByText('浏览器直连提醒')).toBeVisible()
    expect(screen.getByLabelText('API 密钥')).toBeVisible()

    await user.click(screen.getByRole('tab', { name: '角色卡' }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /编辑角色卡/ })).toHaveLength(15))
  })
})
