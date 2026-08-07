export interface MapPoint {
  x: number
  y: number
}

export interface MapSize {
  width: number
  height: number
}

export function clampMapOffset(offset: MapPoint, viewport: MapSize, world: MapSize): MapPoint {
  return {
    x: Math.min(0, Math.max(viewport.width - world.width, offset.x)),
    y: Math.min(0, Math.max(viewport.height - world.height, offset.y)),
  }
}

export function offsetForPoint(point: MapPoint, viewport: MapSize, world: MapSize): MapPoint {
  return clampMapOffset({
    x: viewport.width / 2 - point.x,
    y: viewport.height / 2 - point.y,
  }, viewport, world)
}
