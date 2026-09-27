<script setup lang="ts">
import type { ItemPatch } from '../stores/flow'
import type { FlowItem, ScheduleTime } from '../types'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { useMessageDraft } from '../composables/useMessageDraft'
import { INPUT_DEBOUNCE_MS } from '../utils/constants'
import { getItemContent } from '../utils/nodeMeta'
import AttachmentTiles from './AttachmentTiles.vue'
import BusinessHoursEditor from './BusinessHoursEditor.vue'
import MessageTexts from './MessageTexts.vue'
import BaseButton from './ui/BaseButton.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseTextarea from './ui/BaseTextarea.vue'
import FormField from './ui/FormField.vue'

const props = defineProps<{ item: FlowItem }>()

const emit = defineEmits<{
  update: [id: string, patch: ItemPatch]
  delete: [id: string]
}>()

const content = computed(() => getItemContent(props.item))

const titleDraft = ref('')
const descriptionDraft = ref('')
const commentDraft = ref('')
const titleInvalid = computed(() => !titleDraft.value.trim())

let pending: { id: string, patch: ItemPatch } | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function flush() {
  clearTimeout(timer)
  if (pending)
    emit('update', pending.id, pending.patch)
  pending = null
}

function schedule(patch: ItemPatch) {
  const base = pending?.patch ?? {}
  const data = base.data || patch.data ? { ...base.data, ...patch.data } : undefined
  pending = { id: props.item.id.toString(), patch: { ...base, ...patch, data } }
  clearTimeout(timer)
  timer = setTimeout(flush, INPUT_DEBOUNCE_MS)
}

function onTitleInput() {
  if (!titleInvalid.value)
    schedule({ name: titleDraft.value })
}

function onTitleBlur() {
  if (titleInvalid.value)
    titleDraft.value = content.value?.title ?? ''
  flush()
}

function onDescriptionInput() {
  schedule({ data: { description: descriptionDraft.value } })
}

function onCommentInput() {
  schedule({ data: { comment: commentDraft.value } })
}

function onTimezoneChange(timezone: string) {
  schedule({ data: { timezone } })
  flush()
}

function onTimesChange(times: ScheduleTime[]) {
  schedule({ data: { times } })
}

const {
  texts: messageTexts,
  attachments: messageAttachments,
  hasEmptyText,
  reset: resetMessage,
  editText,
  addText,
  removeText,
  addAttachments,
  removeAttachment,
} = useMessageDraft(toRef(props, 'item'), {
  later: payload => schedule({ data: { payload } }),
  now: (payload) => {
    schedule({ data: { payload } })
    flush()
  },
  flush,
})

const hasUnsavedChanges = computed(() => hasEmptyText.value)

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value)
    event.preventDefault()
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

defineExpose({ hasUnsavedChanges })

const confirmingDelete = ref(false)
const deleteButton = ref<InstanceType<typeof BaseButton> | null>(null)
const cancelDeleteButton = ref<InstanceType<typeof BaseButton> | null>(null)

async function startDelete() {
  confirmingDelete.value = true
  await nextTick()
  cancelDeleteButton.value?.focus()
}

async function cancelDelete() {
  confirmingDelete.value = false
  await nextTick()
  deleteButton.value?.focus()
}

function confirmDelete() {
  clearTimeout(timer)
  pending = null
  emit('delete', props.item.id.toString())
}

watch(() => props.item.id, () => {
  flush()
  confirmingDelete.value = false
  titleDraft.value = content.value?.title ?? ''
  descriptionDraft.value = content.value?.description ?? ''
  commentDraft.value = props.item.type === 'addComment' ? props.item.data.comment : ''
  resetMessage()
}, { immediate: true, flush: 'sync' })

onBeforeUnmount(flush)

const TRIGGER_LABELS = {
  conversationOpened: 'Conversation Opened',
} as const
</script>

<template>
  <div class="flex flex-col gap-6 text-sm">
    <section v-if="content" class="flex flex-col gap-3">
      <FormField v-slot="field" label="Title" :error="titleInvalid ? 'Title is required' : undefined">
        <BaseInput
          v-bind="field"
          v-model="titleDraft"
          name="title"
          type="text"
          required
          @input="onTitleInput"
          @blur="onTitleBlur"
        />
      </FormField>
      <FormField v-slot="field" label="Description" optional>
        <BaseTextarea
          v-bind="field"
          v-model="descriptionDraft"
          name="description"
          rows="3"
          placeholder="No description"
          @input="onDescriptionInput"
          @blur="flush"
        />
      </FormField>
    </section>

    <dl v-if="props.item.type === 'trigger'" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <dt>Trigger</dt>
      <dd>{{ TRIGGER_LABELS[props.item.data.type] }}</dd>
      <dt>Once per contact</dt>
      <dd>{{ props.item.data.oncePerContact ? 'Yes' : 'No' }}</dd>
    </dl>

    <template v-else-if="props.item.type === 'sendMessage'">
      <MessageTexts
        :texts="messageTexts"
        @change="editText"
        @add="addText"
        @remove="removeText"
      />
      <AttachmentTiles
        :attachments="messageAttachments"
        @add="addAttachments"
        @remove="removeAttachment"
      />
    </template>

    <FormField v-else-if="props.item.type === 'addComment'" v-slot="field" label="Comment" optional>
      <BaseTextarea
        v-bind="field"
        v-model="commentDraft"
        name="comment"
        rows="4"
        placeholder="No comment"
        @input="onCommentInput"
        @blur="flush"
      />
    </FormField>

    <BusinessHoursEditor
      v-else-if="props.item.type === 'dateTime'"
      :key="props.item.id"
      :timezone="props.item.data.timezone"
      :times="props.item.data.times"
      @update:timezone="onTimezoneChange"
      @update:times="onTimesChange"
      @commit="flush"
    />

    <section v-if="content" class="border-t border-gray-200 pt-4">
      <BaseButton
        v-if="!confirmingDelete"
        ref="deleteButton"
        variant="ghost-danger"
        icon="pi pi-trash"
        @click="startDelete"
      >
        Delete node
      </BaseButton>
      <div v-else role="group" aria-labelledby="delete-confirm-text" class="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
        <p id="delete-confirm-text">
          Delete this node? Its children will move up to its parent.
        </p>
        <div class="flex gap-2">
          <BaseButton variant="danger" @click="confirmDelete">
            Delete
          </BaseButton>
          <BaseButton ref="cancelDeleteButton" @click="cancelDelete">
            Cancel
          </BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "../style.css";

dl > dt {
  @apply text-gray-500;
}
</style>
