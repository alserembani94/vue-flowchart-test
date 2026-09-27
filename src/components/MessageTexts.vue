<script setup lang="ts">
import type { MessageText } from '../composables/useMessageDraft'
import { computed, nextTick, ref } from 'vue'
import { MAX_VISIBLE_MESSAGE_LINES } from '../utils/constants'
import BaseButton from './ui/BaseButton.vue'
import BaseTextarea from './ui/BaseTextarea.vue'
import FormField from './ui/FormField.vue'

const props = defineProps<{ texts: MessageText[] }>()

const emit = defineEmits<{
  change: [key: string, value: string]
  add: []
  remove: [key: string]
}>()

const list = ref<HTMLElement | null>(null)
const addButton = ref<InstanceType<typeof BaseButton> | null>(null)

const canAdd = computed(() => props.texts.every(text => text.value.trim() !== ''))

function fields() {
  return [...(list.value?.querySelectorAll('textarea') ?? [])]
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
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 font-medium text-gray-500">
      Messages
    </legend>

    <ul ref="list" class="flex flex-col gap-2">
      <li v-for="(text, index) in props.texts" :key="text.key" class="flex items-start gap-2">
        <FormField
          v-slot="field"
          class="flex-1"
          :label="`Message ${index + 1}`"
          hide-label
          :error="text.value.trim() === '' ? 'Message can\'t be empty' : undefined"
        >
          <BaseTextarea
            v-bind="field"
            :model-value="text.value"
            rows="1"
            auto-resize
            :max-rows="MAX_VISIBLE_MESSAGE_LINES"
            @update:model-value="emit('change', text.key, $event)"
          />
        </FormField>
        <BaseButton
          variant="ghost-danger"
          icon="pi pi-trash"
          icon-only
          :label="`Remove message ${index + 1}`"
          @click="remove(index, text.key)"
        />
      </li>
    </ul>

    <BaseButton
      ref="addButton"
      class="self-start"
      variant="primary"
      icon="pi pi-plus"
      :disabled="!canAdd"
      :aria-describedby="canAdd ? undefined : 'add-message-hint'"
      @click="add"
    >
      Add message
    </BaseButton>
    <span v-if="!canAdd" id="add-message-hint" class="text-gray-500">
      Fill in the empty message before adding another.
    </span>
  </fieldset>
</template>
