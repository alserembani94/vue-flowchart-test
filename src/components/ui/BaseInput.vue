<script setup lang="ts">
import { ref } from 'vue'
import { FIELD_BASE, FIELD_INVALID, FIELD_VALID } from './fieldClasses'

const props = withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })

const model = defineModel<string>({ default: '' })

const input = ref<HTMLInputElement | null>(null)

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <input
    ref="input"
    v-model="model"
    :aria-invalid="props.invalid"
    :class="[FIELD_BASE, props.invalid ? FIELD_INVALID : FIELD_VALID]"
  >
</template>
