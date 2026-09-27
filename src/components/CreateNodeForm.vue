<script setup lang="ts">
import type { NewNodeInput, NewNodeType } from '../stores/flow'
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{
  afterName: string
  afterIcon: string
  hasNextSteps: boolean
}>()

const emit = defineEmits<{
  submit: [input: NewNodeInput]
  cancel: []
}>()

const TYPE_OPTIONS: { value: NewNodeType, label: string }[] = [
  { value: 'sendMessage', label: 'Send Message' },
  { value: 'addComment', label: 'Add Comment' },
  { value: 'businessHours', label: 'Business Hours' },
]

const type = ref<NewNodeType | ''>('')
const title = ref('')
const description = ref('')
const submitted = ref(false)

const typeInvalid = computed(() => submitted.value && !type.value)
const titleInvalid = computed(() => submitted.value && !title.value.trim())

const typeSelect = ref<HTMLSelectElement | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)

async function onSubmit() {
  submitted.value = true

  if (!type.value) {
    await nextTick()
    typeSelect.value?.focus()
    return
  }
  if (!title.value.trim()) {
    await nextTick()
    titleInput.value?.focus()
    return
  }

  emit('submit', { type: type.value, name: title.value, description: description.value })
}
</script>

<template>
  <form class="flex flex-col gap-3 text-sm" novalidate @submit.prevent="onSubmit">
    <p id="create-context" class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <span class="text-gray-500">Adding after</span>
      <i :class="props.afterIcon" aria-hidden="true" />
      <span class="min-w-0 truncate font-medium">{{ props.afterName }}</span>
    </p>

    <div class="flex flex-col gap-1">
      <label for="create-type" class="flex flex-col gap-1">
        <span class="text-gray-500">Type of node</span>
        <select
          id="create-type"
          ref="typeSelect"
          v-model="type"
          name="type"
          required
          :aria-invalid="typeInvalid"
          :aria-describedby="typeInvalid ? 'create-type-error' : undefined"
          class="rounded-lg border bg-white px-3 py-2"
          :class="typeInvalid ? 'border-red-500' : 'border-gray-200'"
        >
          <option value="" disabled>Select a type</option>
          <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <span v-if="typeInvalid" id="create-type-error" class="text-red-600">Type of node is required</span>
      <span v-if="type === 'businessHours' && props.hasNextSteps" class="text-gray-500">
        The steps after this point will move under its Success branch.
      </span>
    </div>

    <div class="flex flex-col gap-1">
      <label for="create-title" class="flex flex-col gap-1">
        <span class="text-gray-500">Title</span>
        <input
          id="create-title"
          ref="titleInput"
          v-model="title"
          name="title"
          type="text"
          required
          :aria-invalid="titleInvalid"
          :aria-describedby="titleInvalid ? 'create-title-error' : undefined"
          class="rounded-lg border px-3 py-2"
          :class="titleInvalid ? 'border-red-500' : 'border-gray-200'"
        >
      </label>
      <span v-if="titleInvalid" id="create-title-error" class="text-red-600">Title is required</span>
    </div>

    <label for="create-description" class="flex flex-col gap-1">
      <span class="text-gray-500">Description</span>
      <textarea
        id="create-description"
        v-model="description"
        name="description"
        rows="3"
        class="rounded-lg border border-gray-200 px-3 py-2"
      />
    </label>

    <div class="flex gap-2 pt-2">
      <button type="submit" class="rounded-lg bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">
        Add new node
      </button>
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
