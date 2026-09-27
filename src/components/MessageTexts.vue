<script setup lang="ts">
import type { MessageText } from '../composables/useMessageDraft'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { MAX_VISIBLE_MESSAGE_LINES } from '../utils/constants'

const props = defineProps<{ texts: MessageText[] }>()

const emit = defineEmits<{
  change: [key: string, value: string]
  add: []
  remove: [key: string]
}>()

const list = ref<HTMLElement | null>(null)
const addButton = ref<HTMLButtonElement | null>(null)

const canAdd = computed(() => props.texts.every(text => text.value.trim() !== ''))

function fields() {
  return [...(list.value?.querySelectorAll('textarea') ?? [])]
}

function resize(field: HTMLTextAreaElement) {
  const style = getComputedStyle(field)
  const px = (value: string) => Number.parseFloat(value) || 0
  const lineHeight = px(style.lineHeight) || 20
  const border = px(style.borderTopWidth) + px(style.borderBottomWidth)
  const maxHeight = lineHeight * MAX_VISIBLE_MESSAGE_LINES + px(style.paddingTop) + px(style.paddingBottom) + border

  field.style.height = 'auto'
  const contentHeight = field.scrollHeight + border
  field.style.height = `${Math.min(contentHeight, maxHeight)}px`
  field.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
}

function onInput(key: string, event: Event) {
  const field = event.target as HTMLTextAreaElement
  resize(field)
  emit('change', key, field.value)
}

async function add() {
  emit('add')
  await nextTick()
  fields().at(-1)?.focus()
}

async function remove(index: number, key: string) {
  emit('remove', key)
  await nextTick()
  const remaining = fields()
  const next = remaining[Math.min(index, remaining.length - 1)]
  if (next)
    next.focus()
  else
    addButton.value?.focus()
}

onMounted(() => fields().forEach(resize))
watch(() => props.texts, async () => {
  await nextTick()
  fields().forEach(resize)
})
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 font-medium text-gray-500">
      Messages
    </legend>

    <ul ref="list" class="flex flex-col gap-2">
      <li v-for="(text, index) in props.texts" :key="text.key" class="flex items-start gap-2">
        <div class="flex flex-1 flex-col gap-1">
          <label :for="`message-${text.key}`" class="flex flex-col">
            <span class="sr-only">Message {{ index + 1 }}</span>
            <textarea
              :id="`message-${text.key}`"
              :value="text.value"
              rows="1"
              :aria-invalid="text.value.trim() === ''"
              :aria-describedby="text.value.trim() === '' ? `message-error-${text.key}` : undefined"
              class="resize-none rounded-lg border px-3 py-2"
              :class="text.value.trim() === '' ? 'border-red-500' : 'border-gray-200'"
              @input="onInput(text.key, $event)"
            />
          </label>
          <span v-if="text.value.trim() === ''" :id="`message-error-${text.key}`" class="text-red-600">
            Message can't be empty
          </span>
        </div>
        <button
          type="button"
          :aria-label="`Remove message ${index + 1}`"
          class="rounded-lg p-2 text-red-600 hover:bg-red-50"
          @click="remove(index, text.key)"
        >
          <i class="pi pi-trash" />
        </button>
      </li>
    </ul>

    <button
      ref="addButton"
      type="button"
      :disabled="!canAdd"
      :aria-describedby="canAdd ? undefined : 'add-message-hint'"
      class="self-start rounded-lg bg-gray-900 px-3 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      @click="add"
    >
      <i class="pi pi-plus" /> Add message
    </button>
    <span v-if="!canAdd" id="add-message-hint" class="text-gray-500">
      Fill in the empty message before adding another.
    </span>
  </fieldset>
</template>
