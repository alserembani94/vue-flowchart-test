<script setup lang="ts">
const props = defineProps([
  'type',
  'headerText',
  'bodyText',
]);
</script>

<template>
  <div class="w-48 bg-white rounded-xl text-sm flex flex-col border border-gray-200 drop-shadow transition">
    <div class="flex gap-2 items-center p-2">
       <i class="pi pi-bolt text-2xl text-pink-600" v-if="props.type === 'trigger'"></i>
       <i class="pi pi-calendar-clock text-2xl text-orange-600" v-if="props.type === 'dateTime'"></i>
       <i class="pi pi-send text-2xl text-emerald-600" v-if="props.type === 'sendMessage'"></i>
       <i class="pi pi-comment text-2xl text-sky-600" v-if="props.type === 'addComment'"></i>
       <p>{{ props.headerText }}</p>
    </div>
    <hr class="border-gray-200" />
    <div class="p-2">
      <p>{{ props.bodyText }}</p>
    </div>
  </div>
</template>