export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface Size {
  width: number
  height: number
}

export function isBoxInView(box: Box, viewport: Viewport, container: Size): boolean {
  const left = box.x * viewport.zoom + viewport.x
  const top = box.y * viewport.zoom + viewport.y

  return left >= 0
    && top >= 0
    && left + box.width * viewport.zoom <= container.width
    && top + box.height * viewport.zoom <= container.height
}
