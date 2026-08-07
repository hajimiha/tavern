import { describe, expect, it } from 'vitest'
import { clampMapOffset, offsetForPoint } from './mapViewport'

describe('地图世界层偏移', () => {
  it('将拖动结果限制在地图边界内', () => {
    expect(clampMapOffset(
      { x: 100, y: -500 },
      { width: 600, height: 320 },
      { width: 1200, height: 675 },
    )).toEqual({ x: 0, y: -355 })
  })

  it('把指定地图点定位到视口中央并保持边界有效', () => {
    expect(offsetForPoint(
      { x: 960, y: 506.25 },
      { width: 600, height: 320 },
      { width: 1200, height: 675 },
    )).toEqual({ x: -600, y: -346.25 })
  })
})
