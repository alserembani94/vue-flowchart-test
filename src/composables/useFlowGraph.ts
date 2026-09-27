import type { Edge, Node, NodeDragEvent } from '@vue-flow/core'
import type { LayoutDirection } from './useLayout'
import { useVueFlow } from '@vue-flow/core'
import { nextTick, shallowRef, watch } from 'vue'
import { useFlowStore } from '../stores/flow'
import { computeGraph } from '../utils/computeGraph'
import { createInsertFollower } from '../utils/insertFollow'
import { withInsertPoints } from '../utils/insertPoints'
import { getItemAriaLabel } from '../utils/nodeMeta'
import { useLayout } from './useLayout'

export function useFlowGraph() {
  const flow = useFlowStore()
  const { layout } = useLayout()
  const { fitView, findNode, updateNode } = useVueFlow()

  const nodes = shallowRef<Node[]>([])
  const edges = shallowRef<Edge[]>([])

  let hasFitted = false

  async function layoutGraph(direction: LayoutDirection) {
    nodes.value = layout(nodes.value, edges.value, direction)
    if (hasFitted)
      return

    hasFitted = true
    await nextTick()
    await fitView({ padding: 0.5 })
  }

  watch(() => flow.structureKey, () => {
    const graph = computeGraph(flow.items)
    const composed = withInsertPoints(graph.nodes, graph.edges)
    const hadNodes = nodes.value.length > 0
    const hasNewNodes = composed.nodes.some(node => !findNode(node.id))

    nodes.value = composed.nodes.map((node) => {
      const position = findNode(node.id)?.position
      return position ? { ...node, position: { ...position } } : node
    })
    edges.value = composed.edges

    if (hadNodes && !hasNewNodes)
      void nextTick(async () => layoutGraph('TB'))
  }, { immediate: true })

  watch(
    () => flow.items.map(item => [item.id.toString(), getItemAriaLabel(item)] as const),
    (labels) => {
      for (const [id, ariaLabel] of labels) {
        const node = findNode(id)
        if (node && node.ariaLabel !== ariaLabel)
          updateNode(id, { ariaLabel })
      }
    },
  )

  const insertFollower = createInsertFollower(findNode, (id, position) => updateNode(id, { position }))

  function onNodeDragStart({ node }: NodeDragEvent) {
    insertFollower.start(node)
  }

  function onNodeDrag({ node }: NodeDragEvent) {
    insertFollower.move(node)
  }

  function onNodeDragStop() {
    insertFollower.stop()
  }

  return { nodes, edges, layoutGraph, onNodeDragStart, onNodeDrag, onNodeDragStop }
}
