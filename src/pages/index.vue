<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';
import { useCounterStore } from '../stores/counter';

const store = useCounterStore();
const { data } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
})
</script>

<template>
  <p className="text-6xl">{{store.count}}</p>
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
  <button @click="store.increment()">Increase by 1</button>
</template>