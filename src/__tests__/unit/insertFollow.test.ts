import type { XYPosition } from '@vue-flow/core'
import { describe, expect, it } from 'vitest'
import { createInsertFollower } from '../../utils/insertFollow'
import { insertNodeId } from '../../utils/insertPoints'

function setup(positions: Record<string, XYPosition>) {
  const moves: [string, XYPosition][] = []
  const follower = createInsertFollower(
    id => (id in positions ? { id, position: positions[id] } : undefined),
    (id, position) => moves.push([id, position]),
  )
  return { follower, moves }
}

describe('createInsertFollower', () => {
  it('moves the node\'s + button by the same amount as the node', () => {
    const { follower, moves } = setup({ [insertNodeId('b0653a')]: { x: 80, y: 200 } })

    follower.start({ id: 'b0653a', position: { x: 0, y: 100 } })
    follower.move({ id: 'b0653a', position: { x: 30, y: 140 } })
    follower.move({ id: 'b0653a', position: { x: -10, y: 120 } })

    expect(moves).toEqual([
      [insertNodeId('b0653a'), { x: 110, y: 240 }],
      [insertNodeId('b0653a'), { x: 70, y: 220 }],
    ])
  })

  it('moves nothing else for a node without a + button', () => {
    const { follower, moves } = setup({})

    follower.start({ id: 'd09c08', position: { x: 0, y: 0 } })
    follower.move({ id: 'd09c08', position: { x: 50, y: 50 } })

    expect(moves).toEqual([])
  })

  it('stops following once the drag ends', () => {
    const { follower, moves } = setup({ [insertNodeId('1')]: { x: 0, y: 50 } })

    follower.start({ id: '1', position: { x: 0, y: 0 } })
    follower.stop()
    follower.move({ id: '1', position: { x: 20, y: 20 } })

    expect(moves).toEqual([])
  })

  it('measures each drag from where it started', () => {
    const positions = { [insertNodeId('1')]: { x: 0, y: 50 } }
    const { follower, moves } = setup(positions)

    follower.start({ id: '1', position: { x: 0, y: 0 } })
    follower.move({ id: '1', position: { x: 10, y: 0 } })
    follower.stop()
    positions[insertNodeId('1')] = { x: 10, y: 50 }
    follower.start({ id: '1', position: { x: 10, y: 0 } })
    follower.move({ id: '1', position: { x: 15, y: 5 } })

    expect(moves.at(-1)).toEqual([insertNodeId('1'), { x: 15, y: 55 }])
  })
})
