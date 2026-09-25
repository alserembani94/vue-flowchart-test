<script setup lang="ts">
import { useCounterStore } from '../stores/counter';

const store = useCounterStore();
</script>

<template>
  <p>{{store.count}}</p>
  <button @click="store.increment()">Increase by 1</button>
</template>