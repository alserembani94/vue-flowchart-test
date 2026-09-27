import type { Edge, Node, NodeDragEvent, ViewportTransform } from '@vue-flow/core'
import type { LayoutDirection } from './useLayout'
import { useVueFlow } from '@vue-flow/core'
import { nextTick, shallowRef, watch } from 'vue'
import { useFlowStore } from '../stores/flow'
import { computeGraph } from '../utils/computeGraph'
import { createInsertFollower } from '../utils/insertFollow'
import { insertNodeId, withInsertPoints } from '../utils/insertPoints'
import { createMoveHistory } from '../utils/moveHistory'
import { getItemAriaLabel } from '../utils/nodeMeta'
import { useLayout } from './useLayout'

export function useFlowGraph() {
  const flow = useFlowStore()
  const { layout } = useLayout()
  const { fitView, findNode, updateNode, getViewport, setViewport } = useVueFlow()

  const nodes = shallowRef<Node[]>([])
  const edges = shallowRef<Edge[]>([])

  let hasFitted = false
  let originalViewport: ViewportTransform | null = null

  const moveNode = (id: string, position: { x: number, y: number }) => updateNode(id, { position })
  const insertFollower = createInsertFollower(findNode, moveNode)
  const history = createMoveHistory(findNode, moveNode)

  async function layoutGraph(direction: LayoutDirection) {
    nodes.value = layout(nodes.value, edges.value, direction)
    if (hasFitted)
      return

    hasFitted = true
    await nextTick()
    await fitView({ padding: 0.5 })
    originalViewport = getViewport()
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
    history.clear()

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

  function onNodeDragStart({ node }: NodeDragEvent) {
    history.begin([node.id, insertNodeId(node.id)])
    insertFollower.start(node)
  }

  function onNodeDrag({ node }: NodeDragEvent) {
    insertFollower.move(node)
  }

  function onNodeDragStop() {
    insertFollower.stop()
    history.end()
  }

  function undoMove() {
    history.undo()
  }

  async function resetLayout() {
    history.clear()
    await layoutGraph('TB')
  }

  async function fitOriginalView() {
    if (originalViewport)
      await setViewport(originalViewport, { duration: 200 })
    else
      await fitView({ padding: 0.5, duration: 200 })
  }

  return {
    nodes,
    edges,
    layoutGraph,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    canUndo: history.canUndo,
    undoMove,
    resetLayout,
    fitOriginalView,
  }
}
