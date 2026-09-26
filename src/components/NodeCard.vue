<script setup lang="ts">
import { computed } from 'vue';
import type { FlowItem } from '../types';
import { NODE_META } from '../utils/nodeMeta';

const props = defineProps<{
  type: FlowItem['type'];
  title: string;
  description?: string;
  selected?: boolean;
}>();

const meta = computed(() => NODE_META[props.type]);
</script>

<template>
  <div
    class="w-48 bg-white rounded-xl text-sm flex flex-col border border-gray-200 drop-shadow transition"
    :class="props.selected ? meta.ringSelected : meta.ringFocus"
  >
    <div class="flex gap-2 items-center p-2">
       <i class="text-2xl" :class="[meta.icon, meta.text]"></i>
       <p>{{ props.title }}</p>
    </div>
    <hr class="border-gray-200" />
    <div class="p-2">
      <p>{{ props.description }}</p>
    </div>
  </div>
</template>
