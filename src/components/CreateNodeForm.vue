<script setup lang="ts">
import type { NewNodeInput, NewNodeType } from '../stores/flow'
import { computed, nextTick, ref } from 'vue'
import BaseButton from './ui/BaseButton.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseSelect from './ui/BaseSelect.vue'
import BaseTextarea from './ui/BaseTextarea.vue'
import FormField from './ui/FormField.vue'

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

const typeSelect = ref<InstanceType<typeof BaseSelect> | null>(null)
const titleInput = ref<InstanceType<typeof BaseInput> | null>(null)

const businessHoursNote = computed(() =>
  type.value === 'businessHours' && props.hasNextSteps
    ? 'The steps after this point will move under its Success branch.'
    : undefined,
)

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

    <FormField
      v-slot="field"
      label="Type of node"
      :error="typeInvalid ? 'Type of node is required' : undefined"
      :hint="businessHoursNote"
    >
      <BaseSelect ref="typeSelect" v-bind="field" v-model="type" name="type" required>
        <option value="" disabled>
          Select a type
        </option>
        <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </BaseSelect>
    </FormField>

    <FormField v-slot="field" label="Title" :error="titleInvalid ? 'Title is required' : undefined">
      <BaseInput ref="titleInput" v-bind="field" v-model="title" name="title" type="text" required />
    </FormField>

    <FormField v-slot="field" label="Description" optional>
      <BaseTextarea v-bind="field" v-model="description" name="description" rows="3" />
    </FormField>

    <div class="flex gap-2 pt-2">
      <BaseButton type="submit" variant="primary">
        Add new node
      </BaseButton>
      <BaseButton @click="emit('cancel')">
        Cancel
      </BaseButton>
    </div>
  </form>
</template>
