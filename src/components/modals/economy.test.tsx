import '../../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider, useGame } from '../../game/GameContext'
import { ModalHost } from './ModalHost'

function Harness() {
  const { state, dispatch } = useGame()
  return <><button id="test-open-board" type="button" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'quest-board' })}>打开委托板</button><output aria-label="当前模态">{state.activeModal ?? '关闭'}</output><ModalHost /></>
}

describe('统一经营模态', () => {
  it('按 Escape 关闭委托板并把焦点归还触发按钮', async () => {
    const user = userEvent.setup()
    render(<GameProvider><Harness /></GameProvider>)
    const trigger = screen.getByRole('button', { name: '打开委托板' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: '村民委托板' })).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: '村民委托板' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
