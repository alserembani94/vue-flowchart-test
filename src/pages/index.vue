<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { computed } from 'vue';
import { computeGraph } from '../utils';
import { VueFlow } from '@vue-flow/core'

const { data } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
})

const graphContent = computed(() => {
  if (!data.value) return ({ nodes: [], edges: [] });
  const computedGraph = computeGraph(data.value);

  return computedGraph;
});
</script>

<template>
  <div class="h-screen">

    <VueFlow :nodes="graphContent.nodes" :edges="graphContent.edges" fit-view-on-init>
  
    </VueFlow>
  </div>
</template>