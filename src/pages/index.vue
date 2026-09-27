<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { computeGraph } from '../utils/computeGraph';
import { useVueFlow, VueFlow, type Edge, type Node, type NodeChange, type NodeMouseEvent, type NodeProps } from '@vue-flow/core'
import { useLayout, type LayoutDirection } from '../utils/useLayout';
import { NODE_META, isSelectable } from '../utils/nodeMeta';
import { useFlowStore } from '../stores/flow';
import type { FlowNodeData } from '../types';
import NodeCard from '../components/NodeCard.vue';
import Drawer from '../components/Drawer.vue';
import NodeDetails from '../components/NodeDetails.vue';
import { Background } from '@vue-flow/background'

const CARD_TYPES = ['sendMessage', 'addComment', 'dateTime'] as const;
type CardType = (typeof CARD_TYPES)[number];

const flow = useFlowStore();

const { data } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
  staleTime: Infinity,
})

watch(data, (processes) => {
  if (processes && !flow.loaded) flow.setItems(processes);
}, { immediate: true });

const nodes = shallowRef<Node[]>([]);
const edges = shallowRef<Edge[]>([]);

watch(() => flow.items, (items) => {
  const graph = computeGraph(items);
  nodes.value = graph.nodes;
  edges.value = graph.edges;
}, { immediate: true });

const { layout } = useLayout();
const {
  fitView, findNode, getSelectedNodes, addSelectedNodes, removeSelectedNodes,
  viewport, dimensions, setCenter,
} = useVueFlow();

async function layoutGraph(direction: LayoutDirection) {
  nodes.value = layout(nodes.value, edges.value, direction)

  await nextTick()
  fitView({ padding: 0.5 })
}

const route = useRoute();
const router = useRouter();

const selectedId = computed<string | null>({
  get: () => {
    const node = route.query.node;
    return typeof node === 'string' && node ? node : null;
  },
  set: (id) => {
    if (id === selectedId.value) return;
    router.replace({ query: { ...route.query, node: id ?? undefined } });
  },
});

const selectedItem = computed(() => {
  const item = selectedId.value ? flow.itemsById.get(selectedId.value) : undefined;
  return isSelectable(item) ? item : null;
});

watch([selectedId, () => flow.loaded], ([id, loaded]) => {
  if (id && loaded && !selectedItem.value) selectedId.value = null;
});

function syncSelection() {
  const node = selectedId.value ? findNode(selectedId.value) : undefined;
  const stale = getSelectedNodes.value.filter((selected) => selected.id !== node?.id);

  if (stale.length) removeSelectedNodes(stale);
  if (node && !node.selected) addSelectedNodes([node]);
}

watch([selectedId, nodes], syncSelection, { flush: 'post' });

function onNodesChange(changes: NodeChange[]) {
  const selects = changes.filter((change) => change.type === 'select');
  const selected = selects.find(
    (change) => change.selected && isSelectable(flow.itemsById.get(change.id)),
  );

  if (selected) {
    selectedId.value = selected.id;
  } else if (selects.some((change) => !change.selected && change.id === selectedId.value)) {
    selectedId.value = null;
  }
}

function onNodeClick({ node }: NodeMouseEvent) {
  if (!isSelectable(flow.itemsById.get(node.id))) closeDrawer();
}

const drawer = ref<InstanceType<typeof Drawer> | null>(null);

watch(() => selectedItem.value?.id, (id) => {
  if (id) drawer.value?.focus();
}, { flush: 'post' });

function focusNode(id: string) {
  document
    .querySelector<HTMLElement>(`.vue-flow__node[data-id=${JSON.stringify(id)}]`)
    ?.focus({ preventScroll: true });
}

async function closeDrawer({ returnFocus = false } = {}) {
  const id = selectedId.value;
  selectedId.value = null;

  if (returnFocus && id) {
    await nextTick();
    focusNode(id);
  }
}

function onGraphKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;

  event.stopPropagation();
  if (selectedItem.value) closeDrawer({ returnFocus: true });
}

function onGraphFocusin(event: FocusEvent) {
  const element = (event.target as HTMLElement).closest<HTMLElement>('.vue-flow__node');
  const node = element?.dataset.id ? findNode(element.dataset.id) : undefined;
  if (!node) return;

  const { x, y, zoom } = viewport.value;
  const { width, height } = node.dimensions;
  const left = node.computedPosition.x * zoom + x;
  const top = node.computedPosition.y * zoom + y;
  const inView =
    left >= 0 &&
    top >= 0 &&
    left + width * zoom <= dimensions.value.width &&
    top + height * zoom <= dimensions.value.height;

  if (!inView) {
    setCenter(node.computedPosition.x + width / 2, node.computedPosition.y + height / 2, {
      zoom,
      duration: 200,
    });
  }
}
</script>

<template>
  <div class="h-screen">

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
          <NodeCard v-bind="{
            type: 'trigger',
            icon: NODE_META.trigger.icon,
            title: 'Trigger',
            description: 'Conversation Opened',
            selected
          }" />
        </template>

        <template
          v-for="type in CARD_TYPES"
          :key="type"
          #[`node-${type}`]="{ data, selected }: NodeProps<FlowNodeData<CardType>>"
        >
          <NodeCard v-bind="{
            type,
            icon: NODE_META[type].icon,
            title: data.name,
            description: data.data.description ?? '',
            selected
          }" />
        </template>

        <template #node-dateTimeConnector="{ data }: NodeProps<FlowNodeData<'dateTimeConnector'>>">
          <div class="px-2 py-1 bg-blue-200 text-blue-600 rounded-lg">
            {{ data.data.connectorType }}
          </div>
        </template>

      </VueFlow>
    </div>

    <Drawer ref="drawer" :open="!!selectedItem" @close="closeDrawer({ returnFocus: true })">
      <template v-if="selectedItem" #title>
        <span class="flex items-center gap-2">
          <i :class="[NODE_META[selectedItem.type].icon, NODE_META[selectedItem.type].text]"></i>
          <span class="truncate">{{ NODE_META[selectedItem.type].label }}</span>
        </span>
      </template>

      <NodeDetails v-if="selectedItem" :item="selectedItem" />
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
