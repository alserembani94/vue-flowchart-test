<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { getProcesses } from '../api/process';

const { data } = useQuery({
  queryKey: ['processes'],
  queryFn: getProcesses,
})
</script>

<template>
  <pre>{{ JSON.stringify(data, null, 2) }}</pre>
</template>