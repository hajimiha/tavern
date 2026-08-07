import '../../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { TopHud } from './TopHud'

describe('顶部游戏状态栏', () => {
  it('展示地点、精力、金钱和五项技能', () => {
    render(<GameProvider><TopHud /></GameProvider>)

    expect(screen.getByText('苔灯农场')).toBeVisible()
    expect(screen.getByText('5 / 5')).toBeVisible()
    expect(screen.getByText('500')).toBeVisible()
    expect(screen.getByText('春 · 第 1 日')).toBeVisible()
    expect(screen.getAllByTestId(/^hud-skill-/)).toHaveLength(5)
  })

  it('通过唯一按钮打开背包', async () => {
    const user = userEvent.setup()
    render(<GameProvider><TopHud /></GameProvider>)
    const button = screen.getByRole('button', { name: '打开背包' })

    expect(button).toHaveAttribute('id', 'hud-open-inventory')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
