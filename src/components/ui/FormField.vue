<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  error?: string
  hint?: string
  optional?: boolean
  hideLabel?: boolean
}>()

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`

const field = computed(() => {
  const describedBy = [props.error === undefined ? null : errorId, props.hint === undefined ? null : hintId]
    .filter(value => value !== null)
    .join(' ')
  return {
    'id': id,
    'invalid': props.error !== undefined,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
  }
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="flex flex-col gap-1">
      <span :class="props.hideLabel ? 'sr-only' : 'text-gray-500'">
        {{ props.label }}<template v-if="props.optional"> (optional)</template>
      </span>
      <slot v-bind="field" />
    </label>
    <span v-if="props.error !== undefined" :id="errorId" class="text-red-600">{{ props.error }}</span>
    <span v-if="props.hint !== undefined" :id="hintId" class="text-gray-500">{{ props.hint }}</span>
  </div>
</template>
