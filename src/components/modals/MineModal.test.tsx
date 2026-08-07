import '../../test/setup'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

describe('矿洞层级与电梯', () => {
  it('开放已解锁的五层电梯并锁定尚未抵达的十层', () => {
    render(<GameProvider initialState={{ ...initialGameState, location: 'mine', activeModal: 'mine' }}><ModalHost /></GameProvider>)
    expect(screen.getByRole('button', { name: '搭乘电梯前往第5层' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '第10层电梯尚未解锁' })).toBeDisabled()
    expect(screen.getByText('当前：第 1 层')).toBeVisible()
  })
})
