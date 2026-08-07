import '../../test/setup'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { ModalHost } from './ModalHost'

describe('五行法术书塔', () => {
  it('只允许学习不高于当前魔法等级的未知法术', () => {
    render(<GameProvider initialState={{ ...initialGameState, location: 'library', activeModal: 'library' }}><ModalHost /></GameProvider>)
    expect(screen.getByRole('button', { name: '学习流火矢，消耗 1 点精力' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '魔法等级不足，无法学习金雷裁决' })).toBeDisabled()
  })
})
