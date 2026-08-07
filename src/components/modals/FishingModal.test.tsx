import '../../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

describe('潮汐节奏钓鱼', () => {
  it('消耗一点精力并在绿色时机钓到银鳞鲫', async () => {
    const user = userEvent.setup()
    render(<GameProvider initialState={{ ...initialGameState, location: 'fisher-home', activeModal: 'fishing' }}><ModalHost /></GameProvider>)
    await user.click(screen.getByRole('button', { name: '开始钓鱼，消耗1精力' }))
    await user.click(screen.getByRole('button', { name: '在绿色时机收竿' }))
    expect(screen.getByText('钓到银鳞鲫')).toBeVisible()
    expect(screen.getByText(/钓鱼经验 \+16/)).toBeVisible()
  })
})
