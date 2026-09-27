<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { FIELD_BASE, FIELD_INVALID, FIELD_VALID } from './fieldClasses'

const props = withDefaults(defineProps<{
  invalid?: boolean
  autoResize?: boolean
  maxRows?: number
}>(), { invalid: false })

const model = defineModel<string>({ default: '' })

const textarea = ref<HTMLTextAreaElement | null>(null)

function resize() {
  const field = textarea.value
  if (!props.autoResize || !field)
    return

  const style = getComputedStyle(field)
  const px = (value: string) => Number.parseFloat(value) || 0
  const lineHeight = px(style.lineHeight) || 20
  const border = px(style.borderTopWidth) + px(style.borderBottomWidth)
  const maxHeight = props.maxRows === undefined
    ? Infinity
    : lineHeight * props.maxRows + px(style.paddingTop) + px(style.paddingBottom) + border

  field.style.height = 'auto'
  const contentHeight = field.scrollHeight + border
  field.style.height = `${Math.min(contentHeight, maxHeight)}px`
  field.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
}

onMounted(resize)
watch(model, async () => {
  await nextTick()
  resize()
})

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <textarea
    ref="textarea"
    v-model="model"
    :aria-invalid="props.invalid"
    :class="[FIELD_BASE, props.invalid ? FIELD_INVALID : FIELD_VALID, props.autoResize && 'resize-none']"
  />
</template>
