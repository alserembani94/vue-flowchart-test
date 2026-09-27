<script setup lang="ts">
import { ref } from 'vue'
import { FIELD_BASE, FIELD_INVALID, FIELD_VALID } from './fieldClasses'

const props = withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })

const model = defineModel<string>({ default: '' })

const select = ref<HTMLSelectElement | null>(null)

defineExpose({ focus: () => select.value?.focus() })
</script>

<template>
  <select
    ref="select"
    v-model="model"
    :aria-invalid="props.invalid"
    :class="[FIELD_BASE, props.invalid ? FIELD_INVALID : FIELD_VALID]"
  >
    <slot />
  </select>
</template>
