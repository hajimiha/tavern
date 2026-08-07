import '../../test/setup'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

describe('铁匠与魔女专属柜台', () => {
  it('展示三条工具升级路线与永久上限药剂', () => {
    const { unmount } = render(<GameProvider initialState={{ ...initialGameState, location: 'smithy', activeModal: 'trade', selectedNpcId: 'yanque' }}><ModalHost /></GameProvider>)
    expect(screen.getByRole('button', { name: /升级矿镐/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /精炼铜矿石/ })).toBeVisible()
    unmount()
    render(<GameProvider initialState={{ ...initialGameState, location: 'witch-home', activeModal: 'trade', selectedNpcId: 'daifu' }}><ModalHost /></GameProvider>)
    expect(screen.getByRole('button', { name: /购买金盏恒息药/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /购买蓝雾扩容药/ })).toBeVisible()
  })
})
