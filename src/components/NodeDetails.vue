<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { FlowItem } from '../types';
import { isContentItem, type ItemPatch } from '../stores/flow';
import { INPUT_DEBOUNCE_MS } from '../utils/constants';

const props = defineProps<{ item: FlowItem }>();

const emit = defineEmits<{
  update: [id: string, patch: ItemPatch];
  delete: [id: string];
}>();

const content = computed(() => {
  const { item } = props;
  return isContentItem(item) ? { title: item.name, description: item.data.description ?? '' } : null;
});

const titleDraft = ref('');
const descriptionDraft = ref('');
const titleInvalid = computed(() => !titleDraft.value.trim());

let pending: { id: string; patch: ItemPatch } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  clearTimeout(timer);
  if (pending) emit('update', pending.id, pending.patch);
  pending = null;
}

function schedule(patch: ItemPatch) {
  const base = pending?.patch ?? {};
  const data = base.data || patch.data ? { ...base.data, ...patch.data } : undefined;
  pending = { id: props.item.id.toString(), patch: { ...base, ...patch, data } };
  clearTimeout(timer);
  timer = setTimeout(flush, INPUT_DEBOUNCE_MS);
}

function onTitleInput() {
  if (!titleInvalid.value) schedule({ name: titleDraft.value });
}

function onTitleBlur() {
  if (titleInvalid.value) titleDraft.value = content.value?.title ?? '';
  flush();
}

function onDescriptionInput() {
  schedule({ data: { description: descriptionDraft.value } });
}

const confirmingDelete = ref(false);
const deleteButton = ref<HTMLButtonElement | null>(null);
const cancelDeleteButton = ref<HTMLButtonElement | null>(null);

async function startDelete() {
  confirmingDelete.value = true;
  await nextTick();
  cancelDeleteButton.value?.focus();
}

async function cancelDelete() {
  confirmingDelete.value = false;
  await nextTick();
  deleteButton.value?.focus();
}

function confirmDelete() {
  clearTimeout(timer);
  pending = null;
  emit('delete', props.item.id.toString());
}

watch(() => props.item.id, () => {
  flush();
  confirmingDelete.value = false;
  titleDraft.value = content.value?.title ?? '';
  descriptionDraft.value = content.value?.description ?? '';
}, { immediate: true, flush: 'sync' });

onBeforeUnmount(flush);

const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
} as const;

const TRIGGER_LABELS = {
  conversationOpened: 'Conversation Opened',
} as const;
</script>

<style scoped>
@reference "../style.css";

dl > dt {
  @apply text-gray-500;
}
</style>

<template>
  <div class="flex flex-col gap-6 text-sm">

    <section v-if="content" class="flex flex-col gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-gray-500">Title</span>
        <input
          v-model="titleDraft"
          name="title"
          type="text"
          required
          :aria-invalid="titleInvalid"
          :aria-describedby="titleInvalid ? 'node-title-error' : undefined"
          class="rounded-lg border px-3 py-2"
          :class="titleInvalid ? 'border-red-500' : 'border-gray-200'"
          @input="onTitleInput"
          @blur="onTitleBlur"
        />
        <span v-if="titleInvalid" id="node-title-error" class="text-red-600">Title is required</span>
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-gray-500">Description</span>
        <textarea
          v-model="descriptionDraft"
          name="description"
          rows="3"
          placeholder="No description"
          class="rounded-lg border border-gray-200 px-3 py-2"
          @input="onDescriptionInput"
          @blur="flush"
        ></textarea>
      </label>
    </section>

    <dl v-if="props.item.type === 'trigger'" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <dt>Trigger</dt>
      <dd>{{ TRIGGER_LABELS[props.item.data.type] }}</dd>
      <dt>Once per contact</dt>
      <dd>{{ props.item.data.oncePerContact ? 'Yes' : 'No' }}</dd>
    </dl>

    <section v-else-if="props.item.type === 'sendMessage'" class="flex flex-col gap-2">
      <h3 class="font-medium text-gray-500">Messages</h3>
      <template v-for="(payload, index) in props.item.data.payload" :key="index">
        <p v-if="payload.type === 'text'" class="whitespace-pre-line rounded-lg bg-emerald-50 p-3">
          {{ payload.text }}
        </p>
        <a v-else :href="payload.attachment" target="_blank" rel="noopener noreferrer" class="block">
          <img :src="payload.attachment" alt="Message attachment" loading="lazy" class="rounded-lg border border-gray-200" />
        </a>
      </template>
    </section>

    <section v-else-if="props.item.type === 'addComment'" class="flex flex-col gap-2">
      <h3 class="font-medium text-gray-500">Comment</h3>
      <p class="whitespace-pre-line rounded-lg bg-sky-50 p-3">{{ props.item.data.comment }}</p>
    </section>

    <template v-else-if="props.item.type === 'dateTime'">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt>Timezone</dt>
        <dd>{{ props.item.data.timezone }}</dd>
        <dt>Action</dt>
        <dd>{{ props.item.data.action }}</dd>
        <dt>Connectors</dt>
        <dd class="flex flex-wrap gap-1">
          <code v-for="id in props.item.data.connectors" :key="id" class="rounded bg-gray-100 px-1.5">{{ id }}</code>
        </dd>
      </dl>

      <section class="flex flex-col gap-2">
        <h3 class="font-medium text-gray-500">Schedule</h3>
        <table class="w-full">
          <thead class="text-left text-gray-500">
            <tr>
              <th class="font-normal py-1">Day</th>
              <th class="font-normal py-1">Start</th>
              <th class="font-normal py-1">End</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="time in props.item.data.times" :key="time.day" class="border-t border-gray-100">
              <td class="py-1">{{ DAY_LABELS[time.day] }}</td>
              <td class="py-1">{{ time.startTime }}</td>
              <td class="py-1">{{ time.endTime }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <section v-if="content" class="border-t border-gray-200 pt-4">
      <button
        v-if="!confirmingDelete"
        ref="deleteButton"
        type="button"
        class="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
        @click="startDelete"
      >
        <i class="pi pi-trash"></i> Delete node
      </button>
      <div v-else role="group" aria-labelledby="delete-confirm-text" class="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
        <p id="delete-confirm-text">Delete this node? Its children will move up to its parent.</p>
        <div class="flex gap-2">
          <button type="button" class="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700" @click="confirmDelete">
            Delete
          </button>
          <button
            ref="cancelDeleteButton"
            type="button"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50"
            @click="cancelDelete"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>

    <!-- TODO: Remove this after done with development -->
    <details class="rounded-lg border border-gray-200">
      <summary class="cursor-pointer p-2 text-gray-500">Raw data</summary>
      <pre class="overflow-x-auto border-t border-gray-200 p-2 text-xs">{{ JSON.stringify(props.item, null, 2) }}</pre>
    </details>

  </div>
</template>
