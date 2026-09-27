<script setup lang="ts">
import type { MessageAttachment } from '../composables/useMessageDraft'
import { nextTick, ref } from 'vue'
import { getFileError } from '../utils/attachments'

const props = defineProps<{ attachments: MessageAttachment[] }>()

const emit = defineEmits<{
  add: [urls: string[]]
  remove: [key: string]
}>()

const grid = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const broken = ref(new Set<string>())
const errors = ref<string[]>([])
const announcement = ref('')

function openPicker() {
  fileInput.value?.click()
}

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''

  const accepted = files.filter(file => getFileError(file) === null)
  errors.value = files.flatMap((file) => {
    const error = getFileError(file)
    return error === null ? [] : [error]
  })

  if (accepted.length > 0)
    emit('add', accepted.map(file => URL.createObjectURL(file)))

  const added = accepted.length === 0 ? [] : [`${accepted.length} ${accepted.length === 1 ? 'attachment' : 'attachments'} added`]
  announcement.value = [...added, ...errors.value].join('. ')
}

async function remove(index: number, key: string) {
  emit('remove', key)
  errors.value = []
  announcement.value = 'Attachment removed'
  await nextTick()
  const buttons = [...(grid.value?.querySelectorAll('button') ?? [])]
  buttons[Math.min(index, buttons.length - 1)]?.focus()
}

function markBroken(key: string) {
  broken.value = new Set(broken.value).add(key)
}
</script>

<template>
  <section class="flex flex-col gap-2" aria-labelledby="attachments-heading">
    <h3 id="attachments-heading" class="font-medium text-gray-500">
      Attachments
    </h3>

    <ul ref="grid" class="grid grid-cols-3 gap-2">
      <li v-for="(attachment, index) in props.attachments" :key="attachment.key">
        <button
          type="button"
          :aria-label="`Remove attachment ${index + 1} of ${props.attachments.length}`"
          class="group relative block aspect-square w-full overflow-hidden rounded-lg border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          @click="remove(index, attachment.key)"
        >
          <img
            v-if="!broken.has(attachment.key)"
            :src="attachment.url"
            alt=""
            class="size-full object-cover"
            @error="markBroken(attachment.key)"
          >
          <span v-else class="flex size-full items-center justify-center bg-gray-100 p-2 text-center text-xs text-gray-500">
            Image unavailable
          </span>
          <span class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <i class="pi pi-trash text-xl text-red-500" />
          </span>
        </button>
      </li>
      <li>
        <button
          type="button"
          aria-label="Add attachment"
          class="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          @click="openPicker"
        >
          <i class="pi pi-plus text-xl" />
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          aria-label="Upload images"
          tabindex="-1"
          class="sr-only"
          @change="onFiles"
        >
      </li>
    </ul>

    <ul v-if="errors.length > 0" class="text-red-600">
      <li v-for="error in errors" :key="error">
        {{ error }}
      </li>
    </ul>

    <p class="sr-only" role="status" aria-live="polite">
      {{ announcement }}
    </p>
  </section>
</template>
