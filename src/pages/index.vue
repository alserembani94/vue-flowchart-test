<script setup lang="ts">
import type { NodeMouseEvent, NodeProps } from '@vue-flow/core'
import type { ItemPatch, NewNodeInput } from '../stores/flow'
import type { FlowNodeData } from '../types'
import type { InsertNodeData } from '../utils/insertPoints'
import { useQuery } from '@tanstack/vue-query'
import { Background } from '@vue-flow/background'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { computed, nextTick, ref, watch } from 'vue'
import { getProcesses } from '../api/process'
import CreateNodeForm from '../components/CreateNodeForm.vue'
import Drawer from '../components/Drawer.vue'
import InsertButton from '../components/InsertButton.vue'
import NodeCard from '../components/NodeCard.vue'
import NodeDetails from '../components/NodeDetails.vue'
import { useFlowGraph } from '../composables/useFlowGraph'
import { useNodeSelection } from '../composables/useNodeSelection'
import { useFlowStore } from '../stores/flow'
import { INSERT_NODE_TYPE, insertNodeId } from '../utils/insertPoints'
import { getItemContent, getItemDisplayName, isSelectable, NODE_META } from '../utils/nodeMeta'
import { isBoxInView } from '../utils/viewport'

const CARD_TYPES = ['sendMessage', 'addComment', 'dateTime'] as const
type CardType = (typeof CARD_TYPES)[number]

const flow = useFlowStore()

const { data: processes } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
})

watch(processes, (loaded) => {
  if (loaded && !flow.loaded)
    flow.setItems(loaded)
}, { immediate: true })

const { nodes, layoutGraph, edges } = useFlowGraph()
const details = ref<InstanceType<typeof NodeDetails> | null>(null)

const LEAVE_MESSAGE = 'A message is empty, so your message changes can\'t be saved. Leave anyway and lose them?'

function hasUnsavedChanges() {
  return details.value?.hasUnsavedChanges ?? false
}

function confirmLeave() {
  // eslint-disable-next-line no-alert -- the native dialog is accessible and keeps every leave check synchronous
  return !hasUnsavedChanges() || window.confirm(LEAVE_MESSAGE)
}

const { selectedId, selectedItem, onNodesChange } = useNodeSelection(nodes, { hasUnsavedChanges, confirmLeave })
const { findNode, viewport, dimensions, setCenter } = useVueFlow()

function cardContent(id: string) {
  return getItemContent(flow.itemsById.get(id)) ?? { title: '', description: '' }
}

function insertLabel(parentId: string) {
  const parent = flow.itemsById.get(parentId)
  return parent ? `Add node after ${getItemDisplayName(parent, flow.itemsById)}` : 'Add node'
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
  if (!confirmLeave())
    return
  selectedId.value = null
  createParentId.value = parentId
}

async function closeDrawer({ returnFocus = false } = {}) {
  if (!confirmLeave())
    return
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

  const { x, y } = node.computedPosition
  const { width, height } = node.dimensions

  if (!isBoxInView({ x, y, width, height }, viewport.value, dimensions.value))
    void setCenter(x + width / 2, y + height / 2, { zoom: viewport.value.zoom, duration: 200 })
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
          <InsertButton
            :label="insertLabel(data.parentId)"
            :color="data.color"
            :active="createParentId === data.parentId"
            @click="openCreate(data.parentId)"
          />
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
        ref="details"
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
