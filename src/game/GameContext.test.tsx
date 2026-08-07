import '../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { GameProvider, useGame } from './GameContext'

function SaveHarness() {
  const { state, dispatch } = useGame()
  return <><output aria-label="存档状态">{state.location} · {state.money}</output><button type="button" onClick={() => dispatch({ type: 'TRAVEL_TO_LOCATION', location: 'mine', minutes: 40 })}>前往矿洞</button></>
}

describe('GameProvider 自动存档恢复', () => {
  beforeEach(() => localStorage.clear())

  it('重新挂载时恢复玩家地点和资源进度', async () => {
    const user = userEvent.setup()
    const first = render(<GameProvider><SaveHarness /></GameProvider>)
    await user.click(screen.getByRole('button', { name: '前往矿洞' }))
    expect(screen.getByLabelText('存档状态')).toHaveTextContent('mine · 500')
    first.unmount()

    render(<GameProvider><SaveHarness /></GameProvider>)
    expect(screen.getByLabelText('存档状态')).toHaveTextContent('mine · 500')
  })
})
