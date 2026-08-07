import '../../test/setup'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import type { ModalType } from '../../game/types'
import { ModalHost } from './ModalHost'

function renderFreeMode(modal: Exclude<ModalType, null>, extra = {}) {
  return render(<GameProvider initialState={{
    ...initialGameState,
    ...extra,
    energy: 0,
    activeModal: modal,
    rules: { ...initialGameState.rules, energyCostMode: 'free' },
  }}><ModalHost /></GameProvider>)
}

describe('规则感知的行动成本界面', () => {
  it('自由叙事模式不会在猎人训练入口被固定精力检查拦住', () => {
    renderFreeMode('hunter')
    expect(screen.getByRole('button', { name: /开始训练 · 0 精力/ })).toBeEnabled()
    expect(screen.getByText(/获得 18 点战斗经验/)).toBeVisible()
  })

  it('自由叙事模式允许零精力学习法术、挖矿和钓鱼', () => {
    const library = renderFreeMode('library')
    expect(screen.getByRole('button', { name: '学习白锋术，消耗 0 点精力' })).toBeEnabled()
    library.unmount()

    const mine = renderFreeMode('mine', { location: 'mine' })
    expect(screen.getByRole('button', { name: /开采本层矿脉 · 0 精力/ })).toBeEnabled()
    mine.unmount()

    renderFreeMode('fishing', { location: 'fisher-home', inventory: { ...initialGameState.inventory, 'reed-bait': 1 } })
    expect(screen.getByRole('button', { name: '开始钓鱼，消耗0精力' })).toBeEnabled()
  })
})
