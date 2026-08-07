import '../../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider, useGame } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

function HospitalObserver() {
  const { state } = useGame()
  return <><output aria-label="剩余精力">{state.energy}</output><output aria-label="剩余金币">{state.money}</output><ModalHost /></>
}

describe('地点经营行动', () => {
  it('医院每日一次花费金币恢复两点精力', async () => {
    const user = userEvent.setup()
    render(<GameProvider initialState={{ ...initialGameState, location: 'hospital', energy: 3, activeModal: 'hospital' }}><HospitalObserver /></GameProvider>)
    await user.click(screen.getByRole('button', { name: '支付 180 金币，恢复 2 点精力' }))
    expect(screen.getByLabelText('剩余精力')).toHaveTextContent('5')
    expect(screen.getByLabelText('剩余金币')).toHaveTextContent('2300')
    expect(screen.getByRole('button', { name: '今日已经接受过精力治疗' })).toBeDisabled()
  })
})
