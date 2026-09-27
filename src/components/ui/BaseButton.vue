<script setup lang="ts">
import { ref } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger'

const props = withDefaults(defineProps<{
  variant?: Variant
  type?: 'button' | 'submit' | 'reset'
  icon?: string
  iconOnly?: boolean
  label?: string
  disabled?: boolean
}>(), {
  variant: 'secondary',
  type: 'button',
})

if (import.meta.env.DEV && props.iconOnly && !props.label)
  console.warn('[BaseButton] Icon-only buttons need a label.')

const VARIANT_CLASSES: Record<Variant, string> = {
  'primary': 'bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-400 disabled:bg-gray-200 disabled:text-gray-500',
  'secondary': 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-400',
  'danger': 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 disabled:bg-gray-200 disabled:text-gray-500',
  'ghost': 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-gray-400 disabled:bg-transparent disabled:text-gray-300',
  'ghost-danger': 'text-red-600 hover:bg-red-50 focus-visible:ring-red-400 disabled:bg-transparent disabled:text-gray-300',
}

const button = ref<HTMLButtonElement | null>(null)

defineExpose({ focus: () => button.value?.focus() })
</script>

<template>
  <button
    ref="button"
    :type="props.type"
    :disabled="props.disabled"
    :aria-label="props.iconOnly ? props.label : undefined"
    class="inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
    :class="[VARIANT_CLASSES[props.variant], props.iconOnly ? 'p-2' : 'px-3 py-2']"
  >
    <i v-if="props.icon" :class="props.icon" aria-hidden="true" />
    <slot v-if="!props.iconOnly" />
  </button>
</template>
