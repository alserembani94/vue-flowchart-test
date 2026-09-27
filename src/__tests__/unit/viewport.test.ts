import { describe, expect, it } from 'vitest'
import { isBoxInView } from '../../utils/viewport'

const container = { width: 800, height: 600 }
const box = { x: 100, y: 100, width: 200, height: 100 }

describe('isBoxInView', () => {
  it('is true when the box is fully inside the container', () => {
    expect(isBoxInView(box, { x: 0, y: 0, zoom: 1 }, container)).toBe(true)
  })

  it('is false when the box sticks out on any side', () => {
    expect(isBoxInView({ ...box, x: -10 }, { x: 0, y: 0, zoom: 1 }, container)).toBe(false)
    expect(isBoxInView({ ...box, y: -10 }, { x: 0, y: 0, zoom: 1 }, container)).toBe(false)
    expect(isBoxInView({ ...box, x: 700 }, { x: 0, y: 0, zoom: 1 }, container)).toBe(false)
    expect(isBoxInView({ ...box, y: 550 }, { x: 0, y: 0, zoom: 1 }, container)).toBe(false)
  })

  it('counts a box touching the edges as inside', () => {
    expect(isBoxInView({ x: 0, y: 0, width: 800, height: 600 }, { x: 0, y: 0, zoom: 1 }, container)).toBe(true)
  })

  it('accounts for the viewport pan', () => {
    expect(isBoxInView(box, { x: -150, y: 0, zoom: 1 }, container)).toBe(false)
    expect(isBoxInView({ ...box, x: -100 }, { x: 150, y: 0, zoom: 1 }, container)).toBe(true)
  })

  it('accounts for the zoom level', () => {
    expect(isBoxInView(box, { x: 0, y: 0, zoom: 2 }, container)).toBe(true)
    expect(isBoxInView(box, { x: 0, y: 0, zoom: 3 }, container)).toBe(false)
  })
})
