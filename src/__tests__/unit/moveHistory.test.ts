import type { XYPosition } from '@vue-flow/core'
import { describe, expect, it } from 'vitest'
import { createMoveHistory } from '../../utils/moveHistory'

function setup(initial: Record<string, XYPosition>, limit?: number) {
  const positions: Record<string, XYPosition> = structuredClone(initial)
  const history = createMoveHistory(
    id => (id in positions ? { id, position: positions[id] } : undefined),
    (id, position) => {
      positions[id] = position
    },
    limit,
  )
  const drag = (ids: string[], to: Record<string, XYPosition>) => {
    history.begin(ids)
    Object.assign(positions, to)
    history.end()
  }
  return { history, positions, drag }
}

describe('createMoveHistory', () => {
  it('starts with nothing to undo', () => {
    const { history } = setup({ a: { x: 0, y: 0 } })

    expect(history.canUndo.value).toBe(false)
    expect(history.undo()).toBe(false)
  })

  it('undoes a move, restoring every node that moved with it', () => {
    const { history, positions, drag } = setup({ a: { x: 0, y: 0 }, plus: { x: 0, y: 50 } })

    drag(['a', 'plus'], { a: { x: 30, y: 10 }, plus: { x: 30, y: 60 } })
    expect(history.canUndo.value).toBe(true)

    expect(history.undo()).toBe(true)
    expect(positions).toEqual({ a: { x: 0, y: 0 }, plus: { x: 0, y: 50 } })
    expect(history.canUndo.value).toBe(false)
  })

  it('undoes moves in reverse order', () => {
    const { history, positions, drag } = setup({ a: { x: 0, y: 0 } })

    drag(['a'], { a: { x: 10, y: 0 } })
    drag(['a'], { a: { x: 20, y: 0 } })

    history.undo()
    expect(positions.a).toEqual({ x: 10, y: 0 })
    history.undo()
    expect(positions.a).toEqual({ x: 0, y: 0 })
  })

  it('does not record a drag that ends where it started', () => {
    const { history, drag } = setup({ a: { x: 0, y: 0 } })

    drag(['a'], { a: { x: 0, y: 0 } })

    expect(history.canUndo.value).toBe(false)
  })

  it('ignores nodes that cannot be found', () => {
    const { history, drag } = setup({ a: { x: 0, y: 0 } })

    drag(['a', 'missing'], { a: { x: 5, y: 5 } })

    expect(history.canUndo.value).toBe(true)
  })

  it('keeps only the most recent moves up to the limit', () => {
    const { history, positions, drag } = setup({ a: { x: 0, y: 0 } }, 2)

    drag(['a'], { a: { x: 1, y: 0 } })
    drag(['a'], { a: { x: 2, y: 0 } })
    drag(['a'], { a: { x: 3, y: 0 } })

    history.undo()
    history.undo()
    expect(positions.a).toEqual({ x: 1, y: 0 })
    expect(history.undo()).toBe(false)
  })

  it('forgets everything when cleared', () => {
    const { history, drag } = setup({ a: { x: 0, y: 0 } })
    drag(['a'], { a: { x: 5, y: 5 } })

    history.clear()

    expect(history.canUndo.value).toBe(false)
  })
})
