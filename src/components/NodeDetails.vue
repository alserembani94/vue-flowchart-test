<script setup lang="ts">
import type { FlowItem } from '../types';

const props = defineProps<{ item: FlowItem }>();

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


    <!-- TODO: Remove this after done with development -->
    <details class="rounded-lg border border-gray-200">
      <summary class="cursor-pointer p-2 text-gray-500">Raw data</summary>
      <pre class="overflow-x-auto border-t border-gray-200 p-2 text-xs">{{ JSON.stringify(props.item, null, 2) }}</pre>
    </details>

  </div>
</template>
