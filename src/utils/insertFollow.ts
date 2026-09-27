import type { XYPosition } from '@vue-flow/core'
import { insertNodeId } from './insertPoints'

interface Positioned {
  id: string
  position: XYPosition
}

export function createInsertFollower(
  findNode: (id: string) => Positioned | undefined,
  moveNode: (id: string, position: XYPosition) => void,
) {
  let drag: { insertId: string, nodeStart: XYPosition, insertStart: XYPosition } | null = null

  function start(node: Positioned) {
    const insert = findNode(insertNodeId(node.id))
    drag = insert
      ? { insertId: insert.id, nodeStart: { ...node.position }, insertStart: { ...insert.position } }
      : null
  }

  function move(node: Positioned) {
    if (!drag)
      return
    moveNode(drag.insertId, {
      x: drag.insertStart.x + node.position.x - drag.nodeStart.x,
      y: drag.insertStart.y + node.position.y - drag.nodeStart.y,
    })
  }

  function stop() {
    drag = null
  }

  return { start, move, stop }
}
