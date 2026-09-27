<script setup lang="ts">
import type { Edge, Node, NodeChange, NodeMouseEvent, NodeProps } from '@vue-flow/core'
import type { ItemPatch, NewNodeInput } from '../stores/flow'
import type { FlowNodeData } from '../types'
import type { InsertNodeData } from '../utils/insertPoints'
import type { LayoutDirection } from '../utils/useLayout'
import { useQuery } from '@tanstack/vue-query'
import { Background } from '@vue-flow/background'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProcesses } from '../api/process'
import CreateNodeForm from '../components/CreateNodeForm.vue'
import Drawer from '../components/Drawer.vue'
import NodeCard from '../components/NodeCard.vue'
import NodeDetails from '../components/NodeDetails.vue'
import { isContentItem, useFlowStore } from '../stores/flow'
import { computeGraph } from '../utils/computeGraph'
import { INSERT_NODE_TYPE, insertNodeId, withInsertPoints } from '../utils/insertPoints'
import { getItemAriaLabel, getItemDisplayName, isSelectable, NODE_META } from '../utils/nodeMeta'
import { useLayout } from '../utils/useLayout'

const CARD_TYPES = ['sendMessage', 'addComment', 'dateTime'] as const
type CardType = (typeof CARD_TYPES)[number]

const flow = useFlowStore()

const { data: processes } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
  staleTime: Infinity,
})

watch(processes, (loaded) => {
  if (loaded && !flow.loaded)
    flow.setItems(loaded)
}, { immediate: true })

const nodes = shallowRef<Node[]>([])
const edges = shallowRef<Edge[]>([])

const { layout } = useLayout()
const {
  fitView,
  findNode,
  getSelectedNodes,
  addSelectedNodes,
  removeSelectedNodes,
  viewport,
  dimensions,
  setCenter,
  updateNode,
} = useVueFlow()

let hasFitted = false

async function layoutGraph(direction: LayoutDirection) {
  nodes.value = layout(nodes.value, edges.value, direction)
  if (hasFitted)
    return

  hasFitted = true
  await nextTick()
  fitView({ padding: 0.5 })
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
    nextTick(() => layoutGraph('TB'))
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

function cardContent(id: string) {
  const item = flow.itemsById.get(id)
  return isContentItem(item)
    ? { title: item.name, description: item.data.description ?? '' }
    : { title: '', description: '' }
}

function insertLabel(parentId: string) {
  const parent = flow.itemsById.get(parentId)
  return parent ? `Add node after ${getItemDisplayName(parent, flow.itemsById)}` : 'Add node'
}

const route = useRoute()
const router = useRouter()

const selectedId = computed<string | null>({
  get: () => {
    const node = route.query.node
    return typeof node === 'string' && node ? node : null
  },
  set: (id) => {
    if (id === selectedId.value)
      return
    router.replace({ query: { ...route.query, node: id ?? undefined } })
  },
})

const selectedItem = computed(() => {
  const item = selectedId.value ? flow.itemsById.get(selectedId.value) : undefined
  return isSelectable(item) ? item : null
})

watch([selectedId, () => flow.loaded], ([id, loaded]) => {
  if (id && loaded && !selectedItem.value)
    selectedId.value = null
})

function syncSelection() {
  const node = selectedId.value ? findNode(selectedId.value) : undefined
  const stale = getSelectedNodes.value.filter(selected => selected.id !== node?.id)

  if (stale.length)
    removeSelectedNodes(stale)
  if (node && !node.selected)
    addSelectedNodes([node])
}

watch([selectedId, nodes], syncSelection, { flush: 'post' })

function onNodesChange(changes: NodeChange[]) {
  const selects = changes.filter(change => change.type === 'select')
  const selected = selects.find(
    change => change.selected && isSelectable(flow.itemsById.get(change.id)),
  )

  if (selected) {
    selectedId.value = selected.id
  }
  else if (selects.some(change => !change.selected && change.id === selectedId.value)) {
    selectedId.value = null
  }
}

function onNodeClick({ node }: NodeMouseEvent) {
  if (node.type === INSERT_NODE_TYPE)
    return
  if (!isSelectable(flow.itemsById.get(node.id)))
    closeDrawer()
}

const createParentId = ref<string | null>(null)
const drawerOpen = computed(() => !!selectedItem.value || !!createParentId.value)

const createContext = computed(() => {
  const parentId = createParentId.value
  const parent = parentId ? flow.itemsById.get(parentId) : undefined
  if (!parentId || !parent)
    return null

  const meta = NODE_META[parent.type]
  return {
    afterName: getItemDisplayName(parent, flow.itemsById),
    afterIcon: `${meta.icon} ${meta.text}`,
    hasNextSteps: flow.items.some(item => item.parentId.toString() === parentId),
  }
})

function insertButtonStyle({ parentId, color }: InsertNodeData) {
  const active = createParentId.value === parentId
  return {
    'borderColor': color,
    'color': active ? 'white' : color,
    'backgroundColor': active ? color : undefined,
    '--tw-ring-color': color,
  }
}

watch(selectedId, (id) => {
  if (id)
    createParentId.value = null
})

const drawer = ref<InstanceType<typeof Drawer> | null>(null)

watch([() => selectedItem.value?.id, createParentId], ([id, parentId]) => {
  if (id || parentId)
    drawer.value?.focus()
}, { flush: 'post' })

function focusElement(selector: string) {
  document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
}

function focusNode(id: string) {
  focusElement(`.vue-flow__node[data-id=${JSON.stringify(id)}]`)
}

function focusInsertButton(parentId: string) {
  focusElement(`.vue-flow__node[data-id=${JSON.stringify(insertNodeId(parentId))}] button`)
}

function openCreate(parentId: string) {
  selectedId.value = null
  createParentId.value = parentId
}

async function closeDrawer({ returnFocus = false } = {}) {
  const id = selectedId.value
  const insertParentId = createParentId.value
  selectedId.value = null
  createParentId.value = null

  if (!returnFocus)
    return
  await nextTick()
  if (insertParentId)
    focusInsertButton(insertParentId)
  else if (id)
    focusNode(id)
}

function onCreate(input: NewNodeInput) {
  const parentId = createParentId.value
  const id = parentId ? flow.insertItem(input, parentId) : null
  if (!id)
    return

  createParentId.value = null
  selectedId.value = id
}

function onUpdate(id: string, patch: ItemPatch) {
  flow.updateItem(id, patch)
}

async function onDelete(id: string) {
  const parentId = flow.itemsById.get(id)?.parentId.toString()
  if (!parentId || !flow.deleteItem(id))
    return

  selectedId.value = null
  await nextTick()
  focusInsertButton(parentId)
}

function onGraphKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape')
    return

  event.stopPropagation()
  if (drawerOpen.value)
    closeDrawer({ returnFocus: true })
}

function onGraphFocusin(event: FocusEvent) {
  const element = (event.target as HTMLElement).closest<HTMLElement>('.vue-flow__node')
  const node = element?.dataset.id ? findNode(element.dataset.id) : undefined
  if (!node)
    return

  const { x, y, zoom } = viewport.value
  const { width, height } = node.dimensions
  const left = node.computedPosition.x * zoom + x
  const top = node.computedPosition.y * zoom + y
  const inView
    = left >= 0
      && top >= 0
      && left + width * zoom <= dimensions.value.width
      && top + height * zoom <= dimensions.value.height

  if (!inView) {
    setCenter(node.computedPosition.x + width / 2, node.computedPosition.y + height / 2, {
      zoom,
      duration: 200,
    })
  }
}
</script>

<template>
  <div class="h-screen">
    <!-- eslint-disable-next-line vue-a11y/no-static-element-interactions -- delegates Escape and focus handling for the nodes inside -->
    <div class="h-full" @keydown.capture="onGraphKeydown" @focusin="onGraphFocusin">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :nodes-connectable="false"
        :delete-key-code="null"
        :selection-key-code="null"
        :multi-selection-key-code="null"
        :select-nodes-on-drag="false"
        :edges-focusable="false"
        @nodes-initialized="layoutGraph('TB')"
        @nodes-change="onNodesChange"
        @node-click="onNodeClick"
        @pane-click="closeDrawer()"
      >
        <Background />

        <template #node-trigger="{ selected }: NodeProps<FlowNodeData<'trigger'>>">
          <NodeCard
            v-bind="{
              type: 'trigger',
              icon: NODE_META.trigger.icon,
              title: 'Trigger',
              description: 'Conversation Opened',
              selected,
            }"
          />
        </template>

        <template
          v-for="type in CARD_TYPES"
          :key="type"
          #[`node-${type}`]="{ id, selected }: NodeProps<FlowNodeData<CardType>>"
        >
          <NodeCard
            v-bind="{
              type,
              icon: NODE_META[type].icon,
              ...cardContent(id),
              selected,
            }"
          />
        </template>

        <template #node-insert="{ data }: NodeProps<InsertNodeData>">
          <button
            type="button"
            :aria-label="insertLabel(data.parentId)"
            :aria-expanded="createParentId === data.parentId"
            :style="insertButtonStyle(data)"
            class="nodrag flex size-7 items-center justify-center rounded-full border bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            @click="openCreate(data.parentId)"
          >
            <i class="pi pi-plus text-xs" />
          </button>
        </template>

        <template #node-dateTimeConnector="{ data }: NodeProps<FlowNodeData<'dateTimeConnector'>>">
          <div class="px-2 py-1 bg-blue-200 text-blue-600 rounded-lg">
            {{ data.data.connectorType }}
          </div>
        </template>
      </VueFlow>
    </div>

    <Drawer
      ref="drawer"
      :open="drawerOpen"
      :describedby="createContext ? 'create-context' : undefined"
      @close="closeDrawer({ returnFocus: true })"
    >
      <template v-if="createParentId" #title>
        New node
      </template>
      <template v-else-if="selectedItem" #title>
        <span class="flex items-center gap-2">
          <i :class="[NODE_META[selectedItem.type].icon, NODE_META[selectedItem.type].text]" />
          <span class="truncate">{{ NODE_META[selectedItem.type].label }}</span>
        </span>
      </template>

      <CreateNodeForm
        v-if="createContext"
        :key="createParentId!"
        v-bind="createContext"
        @submit="onCreate"
        @cancel="closeDrawer({ returnFocus: true })"
      />
      <NodeDetails
        v-else-if="selectedItem"
        :item="selectedItem"
        @update="onUpdate"
        @delete="onDelete"
      />
    </Drawer>
  </div>
</template>

<style scoped>
:deep(.vue-flow__handle) {
  visibility: hidden;
}

:deep(.vue-flow__node:focus-visible) {
  outline: none;
}
</style>
