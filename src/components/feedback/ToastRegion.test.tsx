import '../../test/setup'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ToastRegion } from './ToastRegion'

describe('应用内通知', () => {
  it('以礼貌播报区域展示并可关闭通知', async () => {
    const user = userEvent.setup()
    render(
      <GameProvider initialState={{
        ...initialGameState,
        toasts: [{ id: 'test-notice', tone: 'success', title: '收获完成', message: '获得3个月铃萝卜' }],
      }}>
        <ToastRegion />
      </GameProvider>,
    )

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('获得3个月铃萝卜')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '关闭“收获完成”通知' }))
    expect(screen.queryByText('获得3个月铃萝卜')).not.toBeInTheDocument()
  })
})
