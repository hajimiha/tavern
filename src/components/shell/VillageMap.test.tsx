import '../../test/setup'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameProvider, useGame } from '../../game/GameContext'
import { VillageMap } from './VillageMap'

function LocationObserver() {
  const { state } = useGame()
  return <output aria-label="当前地点标识">{state.location}</output>
}

describe('连续像素村庄地图', () => {
  afterEach(() => vi.useRealTimers())

  it('为十个村庄地点提供可聚焦的语义热区', () => {
    render(<GameProvider><VillageMap /><LocationObserver /></GameProvider>)

    expect(screen.getAllByRole('button', { name: /^前往/ })).toHaveLength(10)
    expect(screen.getByRole('button', { name: '前往矿洞' })).toHaveAttribute('id', 'map-location-mine')
  })

  it('确认行程后更新玩家位置', async () => {
    const user = userEvent.setup()
    render(<GameProvider><VillageMap /><LocationObserver /></GameProvider>)

    await user.click(screen.getByRole('button', { name: '前往矿洞' }))
    const dialog = screen.getByRole('dialog', { name: '前往矿洞' })
    expect(dialog).toBeVisible()
    expect(within(dialog).getByText('40 分钟')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '确认前往矿洞' }))
    expect(screen.getByLabelText('当前地点标识')).toHaveTextContent('mine')
  })

  it('保留定位与重置控件，并通过键盘提供平移路径', async () => {
    const user = userEvent.setup()
    render(<GameProvider><VillageMap /></GameProvider>)

    const viewport = screen.getByRole('application', { name: '可拖动的雾灯谷地图' })
    expect(screen.getByRole('button', { name: '定位当前地点' })).toHaveAttribute('id', 'map-center-current')
    expect(screen.getByRole('button', { name: '重置地图视野' })).toHaveAttribute('id', 'map-reset-view')
    expect(screen.queryByRole('button', { name: '向左移动地图' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '向右移动地图' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '向上移动地图' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '向下移动地图' })).not.toBeInTheDocument()

    await user.click(viewport)
    const before = Number(viewport.getAttribute('data-offset-x'))
    await user.keyboard('{ArrowLeft}')
    expect(Number(viewport.getAttribute('data-offset-x'))).toBeLessThan(before)
  })

  it('在空白处拖动且没有尾随 click 时仍允许下一次主动选择地点', async () => {
    vi.useFakeTimers()
    render(<GameProvider><VillageMap /></GameProvider>)

    const viewport = screen.getByRole('application', { name: '可拖动的雾灯谷地图' })
    fireEvent.pointerDown(viewport, { pointerId: 7, button: 0, clientX: 320, clientY: 180 })
    fireEvent.pointerMove(viewport, { pointerId: 7, clientX: 260, clientY: 130 })
    fireEvent.pointerUp(viewport, { pointerId: 7, clientX: 260, clientY: 130 })
    await vi.runAllTimersAsync()

    fireEvent.click(screen.getByRole('button', { name: '前往渔家' }))
    expect(screen.getByRole('dialog', { name: '前往渔家' })).toBeVisible()
  })
})
