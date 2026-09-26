<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { nextTick, shallowRef, watch } from 'vue';
import { computeGraph } from '../utils/computeGraph';
import { useVueFlow, VueFlow, type Edge, type Node } from '@vue-flow/core'
import { useLayout, type LayoutDirection } from '../utils/useLayout';
import NodeCard from '../components/NodeCard.vue';

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
const { fitView } = useVueFlow();

async function layoutGraph(direction: LayoutDirection) {
  nodes.value = layout(nodes.value, edges.value, direction)

  await nextTick()
  fitView()
}
</script>

<template>
  <div class="h-screen">

    <VueFlow :nodes="nodes" :edges="edges" :nodes-connectable="false" fit-view-on-init @nodes-initialized="layoutGraph('TB')">

      <template #node-trigger="customNodeProps">
        <NodeCard v-bind="{
          type: customNodeProps.type,
          headerText: 'Trigger',
          bodyText: 'Conversation Opened'
        }" />
      </template>

      <template #node-sendMessage="customNodeProps">
        <NodeCard v-bind="{
          type: customNodeProps.type,
          headerText: customNodeProps.data.name,
          bodyText: 'Test'
        }" />
      </template>

      <template #node-addComment="customNodeProps">
        <NodeCard v-bind="{
          type: customNodeProps.type,
          headerText: customNodeProps.data.name,
          bodyText: 'Test'
        }" />
      </template>

      <template #node-dateTime="customNodeProps">
        <NodeCard v-bind="{
          type: customNodeProps.type,
          headerText: customNodeProps.data.name,
          bodyText: 'Test'
        }" />
      </template>

      <template #node-dateTimeConnector="customNodeProps">
        <div class="px-2 py-1 bg-blue-200 text-blue-600 rounded-lg">
          {{ customNodeProps.data.data.connectorType }}
        </div>
      </template>

    </VueFlow>
  </div>
</template>

<style scoped>
@reference "../style.css";

:deep(.vue-flow__handle) {
  visibility: hidden;
}

.vue-flow__node-trigger.selected > div {
  @apply border-pink-600;
}
.vue-flow__node-sendMessage.selected > div {
  @apply border-emerald-600;
}
.vue-flow__node-addComment.selected > div {
  @apply border-sky-600;
}
.vue-flow__node-dateTime.selected > div {
  @apply border-orange-600;
}
</style>
