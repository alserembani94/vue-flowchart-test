<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { nextTick, shallowRef, watch } from 'vue';
import { computeGraph } from '../utils';
import { useVueFlow, VueFlow, type Edge, type Node } from '@vue-flow/core'
import { useLayout, type LayoutDirection } from '../utils/useLayout';

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
  
    </VueFlow>
  </div>
</template>

<style scoped>
:deep(.vue-flow__handle) {
  visibility: hidden;
}
</style>
