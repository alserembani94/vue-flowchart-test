import type { Edge, Node, XYPosition } from '@vue-flow/core'
import type { FlowItem, FlowNodeData } from '../types'
import { getItemAriaLabel, NODE_META } from './nodeMeta'

const originalPos: XYPosition = { x: 0, y: 0 }

function orderTopDown(data: FlowItem[]): FlowItem[] {
  const ids = new Set(data.map(item => item.id.toString()))
  const childrenOf = new Map<string, FlowItem[]>()
  for (const item of data) {
    const parentId = item.parentId.toString()
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), item])
  }

  const ordered: FlowItem[] = []
  const queue = data.filter(item => !ids.has(item.parentId.toString()))
  const seen = new Set<FlowItem>()

  while (queue.length) {
    const item = queue.shift()!
    if (seen.has(item))
      continue
    seen.add(item)
    ordered.push(item)
    queue.push(...(childrenOf.get(item.id.toString()) ?? []))
  }

  return [...ordered, ...data.filter(item => !seen.has(item))]
}

export function computeGraph(data: FlowItem[]) {
  const nodes: Node<FlowNodeData>[] = []
  const edges: Edge[] = []

  const items = orderTopDown(data)

  items.forEach((flowItem) => {
    const { selectable } = NODE_META[flowItem.type]

    nodes.push({
      id: flowItem.id.toString(),
      position: originalPos,
      type: flowItem.type,
      selectable,
      focusable: selectable,
      ariaLabel: getItemAriaLabel(flowItem),
      data: { ...flowItem, label: flowItem.type },
    })
  })

  const itemsById = new Map(data.map(item => [item.id.toString(), item]))

  items.forEach((flowItem) => {
    const parent = itemsById.get(flowItem.parentId.toString())
    if (!parent)
      return

    edges.push({
      id: `${parent.id}-${flowItem.id}`,
      source: parent.id.toString(),
      target: flowItem.id.toString(),
      style: {
        stroke: NODE_META[parent.type].stroke,
        strokeWidth: 2,
      },
      type: 'smoothstep',
      data: flowItem,
    })
  })

  return { nodes, edges }
}
