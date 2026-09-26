<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { computed, nextTick, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { computeGraph } from '../utils/computeGraph';
import { useVueFlow, VueFlow, type Edge, type Node, type NodeMouseEvent, type NodeProps } from '@vue-flow/core'
import { useLayout, type LayoutDirection } from '../utils/useLayout';
import { NODE_META, getItemTitle, isSelectable } from '../utils/nodeMeta';
import { getMessagePreview } from '../utils/getMessagePreview';
import type { FlowNodeData } from '../types';
import NodeCard from '../components/NodeCard.vue';
import Drawer from '../components/Drawer.vue';
import NodeDetails from '../components/NodeDetails.vue';

const { data } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
})

const nodes = shallowRef<Node[]>([]);
const edges = shallowRef<Edge[]>([]);

watch(data, (processes) => {
  const graph = computeGraph(processes ?? []);
  nodes.value = graph.nodes;
  edges.value = graph.edges;
}, { immediate: true });

const { layout } = useLayout();
const { fitView, findNode, getSelectedNodes, addSelectedNodes, removeSelectedNodes } = useVueFlow();

async function layoutGraph(direction: LayoutDirection) {
  nodes.value = layout(nodes.value, edges.value, direction)

  await nextTick()
  fitView()
}

const route = useRoute();
const router = useRouter();

const selectedId = computed<string | null>({
  get: () => {
    const node = route.query.node;
    return typeof node === 'string' && node ? node : null;
  },
  set: (id) => {
    router.replace({ query: { ...route.query, node: id ?? undefined } });
  },
});

const itemsById = computed(
  () => new Map((data.value ?? []).map((item) => [item.id.toString(), item])),
);

const selectedItem = computed(() => {
  const item = selectedId.value ? itemsById.value.get(selectedId.value) : undefined;
  return isSelectable(item) ? item : null;
});

watch([selectedId, data], ([id, processes]) => {
  if (id && processes && !selectedItem.value) selectedId.value = null;
});

function syncSelection() {
  const node = selectedId.value ? findNode(selectedId.value) : undefined;
  const stale = getSelectedNodes.value.filter((selected) => selected.id !== node?.id);

  if (stale.length) removeSelectedNodes(stale);
  if (node && !node.selected) addSelectedNodes([node]);
}

watch([selectedId, nodes], syncSelection, { flush: 'post' });

function closeDrawer() {
  selectedId.value = null;
}

function onNodeClick({ node }: NodeMouseEvent) {
  selectedId.value = isSelectable(itemsById.value.get(node.id)) ? node.id : null;
}
</script>

<template>
  <div class="h-screen">

    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :nodes-connectable="false"
      :delete-key-code="null"
      :selection-key-code="null"
      :multi-selection-key-code="null"
      fit-view-on-init
      @nodes-initialized="layoutGraph('TB')"
      @node-click="onNodeClick"
      @pane-click="closeDrawer"
    >

      <template #node-trigger="{ selected }: NodeProps<FlowNodeData<'trigger'>>">
        <NodeCard v-bind="{
          type: 'trigger',
          title: 'Trigger',
          description: 'Conversation Opened',
          selected
        }" />
      </template>

      <template #node-sendMessage="{ data, selected }: NodeProps<FlowNodeData<'sendMessage'>>">
        <NodeCard v-bind="{
          type: 'sendMessage',
          title: data.name,
          description: `Message: ${getMessagePreview(data.data.payload)}`,
          selected
        }" />
      </template>

      <template #node-addComment="{ data, selected }: NodeProps<FlowNodeData<'addComment'>>">
        <NodeCard v-bind="{
          type: 'addComment',
          title: data.name,
          description: data.data.comment,
          selected
        }" />
      </template>

      <template #node-dateTime="{ data, selected }: NodeProps<FlowNodeData<'dateTime'>>">
        <NodeCard v-bind="{
          type: 'dateTime',
          title: data.name,
          description: `${data.name} + ${data.data.timezone}`,
          selected
        }" />
      </template>

      <template #node-dateTimeConnector="{ data }: NodeProps<FlowNodeData<'dateTimeConnector'>>">
        <div class="px-2 py-1 bg-blue-200 text-blue-600 rounded-lg">
          {{ data.data.connectorType }}
        </div>
      </template>

    </VueFlow>

    <Drawer :open="!!selectedItem" @close="closeDrawer">
      <template v-if="selectedItem" #title>
        <span class="flex items-center gap-2">
          <i :class="[NODE_META[selectedItem.type].icon, NODE_META[selectedItem.type].text]"></i>
          <span class="truncate">{{ getItemTitle(selectedItem) }}</span>
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
</style>
