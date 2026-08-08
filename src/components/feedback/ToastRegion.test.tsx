import '../../test/setup'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameProvider, useGame } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ToastRegion } from './ToastRegion'

function AddNoticeButton() {
  const { dispatch } = useGame()
  return <button type="button" onClick={() => dispatch({ type: 'ADD_TOAST', toast: { tone: 'info', title: '第二条', message: '稍后出现' } })}>添加第二条</button>
}

afterEach(() => vi.useRealTimers())

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

  it('最多显示三条通知，并让每条通知在各自出现两秒后自动消失', () => {
    vi.useFakeTimers()
    render(
      <GameProvider initialState={{
        ...initialGameState,
        toasts: [
          { id: 'notice-1', tone: 'info', title: '第一条', message: '最早通知' },
          { id: 'notice-2', tone: 'info', title: '第二条', message: '第二通知' },
          { id: 'notice-3', tone: 'success', title: '第三条', message: '第三通知' },
          { id: 'notice-4', tone: 'warning', title: '第四条', message: '最新通知' },
        ],
      }}><ToastRegion /></GameProvider>,
    )

    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.queryByText('最早通知')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1999))
    expect(screen.getByText('第二通知')).toBeVisible()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByText('第二通知')).not.toBeInTheDocument()
    expect(screen.queryByText('最新通知')).not.toBeInTheDocument()
  })

  it('新通知不会重置较早通知的独立两秒计时', () => {
    vi.useFakeTimers()
    render(
      <GameProvider initialState={{
        ...initialGameState,
        toasts: [{ id: 'notice-first', tone: 'success', title: '播种完成', message: '月铃萝卜已经入土' }],
      }}><AddNoticeButton /><ToastRegion /></GameProvider>,
    )

    act(() => vi.advanceTimersByTime(1000))
    fireEvent.click(screen.getByRole('button', { name: '添加第二条' }))
    act(() => vi.advanceTimersByTime(999))
    expect(screen.getByText('月铃萝卜已经入土')).toBeVisible()
    expect(screen.getByText('稍后出现')).toBeVisible()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByText('月铃萝卜已经入土')).not.toBeInTheDocument()
    expect(screen.getByText('稍后出现')).toBeVisible()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText('稍后出现')).not.toBeInTheDocument()
  })
})
