<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  open: boolean;
  title?: string;
}>();

const emit = defineEmits<{ close: [] }>();

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !event.defaultPrevented) emit('close');
}

watch(() => props.open, (open, _, onCleanup) => {
  if (!open) return;
  window.addEventListener('keydown', onKeydown);
  onCleanup(() => window.removeEventListener('keydown', onKeydown));
}, { immediate: true });
</script>

<template>
  <Transition
    enter-from-class="translate-x-full"
    enter-active-class="transition-transform duration-200 ease-out"
    leave-to-class="translate-x-full"
    leave-active-class="transition-transform duration-150 ease-in"
  >
    <aside
      v-if="props.open"
      class="fixed inset-y-0 right-0 z-10 w-96 max-w-full bg-white shadow-xl flex flex-col"
    >
      <header class="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
        <h2 id="drawer-title" class="font-semibold min-w-0">
          <slot name="title">{{ props.title }}</slot>
        </h2>
        <button
          type="button"
          class="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          @click="emit('close')"
        >
          <i class="pi pi-times"></i>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-4">
        <slot />
      </div>
    </aside>
  </Transition>
</template>
