<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  color: string
  active?: boolean
}>()

const emit = defineEmits<{ click: [] }>()

const style = computed(() => ({
  'borderColor': props.color,
  'color': props.active ? 'white' : props.color,
  'backgroundColor': props.active ? props.color : undefined,
  '--tw-ring-color': props.color,
}))
</script>

<template>
  <button
    type="button"
    :aria-label="props.label"
    :aria-expanded="props.active"
    :style="style"
    class="nodrag flex size-7 items-center justify-center rounded-full border bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    @click="emit('click')"
  >
    <i class="pi pi-plus text-xs" />
  </button>
</template>
