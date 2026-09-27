<script setup lang="ts">
import type { FlowItem } from '../types'
import { computed } from 'vue'
import { NODE_META } from '../utils/nodeMeta'

const props = defineProps<{
  type: FlowItem['type']
  icon: string
  title: string
  description?: string
  selected?: boolean
}>()

const meta = computed(() => NODE_META[props.type])
</script>

<template>
  <div
    class="w-48 bg-white rounded-xl text-sm flex flex-col border border-gray-200 drop-shadow transition"
    :class="props.selected ? meta.ringSelected : meta.ringFocus"
  >
    <div class="flex gap-2 items-center p-2">
      <i class="text-2xl" :class="[props.icon, meta.text]" />
      <p>{{ props.title }}</p>
    </div>
    <hr class="border-gray-200">
    <div class="p-2">
      <p v-if="props.description" class="line-clamp-3 wrap-break-word">
        {{ props.description }}
      </p>
      <p v-else class="text-gray-400 italic">
        No description
      </p>
    </div>
  </div>
</template>
