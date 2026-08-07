import '../../test/setup'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { FarmStage } from './FarmStage'

describe('农场主舞台', () => {
  it('呈现二十四块可交互农田并打开作物详情', async () => {
    const user = userEvent.setup()
    render(<GameProvider><FarmStage /></GameProvider>)

    expect(screen.getAllByRole('button', { name: /^地块/ })).toHaveLength(24)
    await user.click(screen.getByRole('button', { name: '地块 1-1，月铃萝卜，1日8小时后成熟' }))

    const dialog = screen.getByRole('dialog', { name: '地块详情' })
    expect(dialog).toBeVisible()
    expect(within(dialog).getByText('月铃萝卜')).toBeVisible()
    expect(screen.getByRole('button', { name: '给地块 1-1 浇水' })).toBeEnabled()
  })

  it('收获成熟作物后将地块清空', async () => {
    const user = userEvent.setup()
    render(<GameProvider><FarmStage /></GameProvider>)

    await user.click(screen.getByRole('button', { name: '地块 1-2，夕照麦，已经成熟' }))
    await user.click(screen.getByRole('button', { name: '收获地块 1-2 的夕照麦' }))

    expect(screen.getByRole('button', { name: '地块 1-2，空地' })).toBeVisible()
  })
})
