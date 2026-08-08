import '../../test/setup'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameProvider } from '../../game/GameContext'
import { initialGameState } from '../../game/reducer'
import { LocationStage } from './LocationStage'

describe('地点人物动态行程', () => {
  it('角色离开工作地点后不再显示静态常驻立绘', () => {
    render(
      <GameProvider initialState={{ ...initialGameState, location: 'general-store', minutes: 19 * 60 }}>
        <LocationStage />
      </GameProvider>,
    )

    expect(screen.queryByRole('button', { name: '与杂货店主柳安互动' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '与账房桃弥互动' })).not.toBeInTheDocument()
  })

  it('角色按休闲行程出现在原本没有常驻NPC的图书馆', () => {
    render(
      <GameProvider initialState={{ ...initialGameState, location: 'library', minutes: 19 * 60 }}>
        <LocationStage />
      </GameProvider>,
    )

    expect(screen.getByRole('button', { name: '与杂货店主柳安互动' })).toBeVisible()
    expect(screen.getByRole('button', { name: '与账房桃弥互动' })).toBeVisible()
  })
})
