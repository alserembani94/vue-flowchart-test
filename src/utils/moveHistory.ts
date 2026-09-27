import type { XYPosition } from '@vue-flow/core'
import { computed, shallowRef } from 'vue'
import { MOVE_HISTORY_LIMIT } from './constants'

interface Positioned {
  id: string
  position: XYPosition
}

export function createMoveHistory(
  findNode: (id: string) => Positioned | undefined,
  moveNode: (id: string, position: XYPosition) => void,
  limit = MOVE_HISTORY_LIMIT,
) {
  const entries = shallowRef<Positioned[][]>([])
  let pending: Positioned[] | null = null

  function snapshot(ids: string[]): Positioned[] {
    return ids.flatMap((id) => {
      const node = findNode(id)
      return node ? [{ id, position: { ...node.position } }] : []
    })
  }

  function begin(ids: string[]) {
    pending = snapshot(ids)
  }

  function end() {
    const before = pending
    pending = null
    if (!before || before.length === 0)
      return

    const after = snapshot(before.map(entry => entry.id))
    const moved = after.some((entry) => {
      const start = before.find(saved => saved.id === entry.id)?.position
      return start === undefined || entry.position.x !== start.x || entry.position.y !== start.y
    })
    if (moved)
      entries.value = [...entries.value, before].slice(-limit)
  }

  function undo(): boolean {
    const last = entries.value.at(-1)
    if (!last)
      return false
    entries.value = entries.value.slice(0, -1)
    for (const { id, position } of last)
      moveNode(id, position)
    return true
  }

  function clear() {
    entries.value = []
    pending = null
  }

  const canUndo = computed(() => entries.value.length > 0)

  return { begin, end, undo, clear, canUndo }
}
