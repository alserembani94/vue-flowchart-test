<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BaseButton from './ui/BaseButton.vue'

const props = defineProps<{ canUndo: boolean }>()

const emit = defineEmits<{
  undo: []
  reset: []
  fit: []
}>()

type ActionId = 'undo' | 'reset' | 'fit'

const actions = computed(() => [
  { id: 'undo' as const, label: 'Undo move', icon: 'pi pi-undo', disabled: !props.canUndo },
  { id: 'reset' as const, label: 'Reset layout', icon: 'pi pi-sitemap', disabled: false },
  { id: 'fit' as const, label: 'Fit view', icon: 'pi pi-expand', disabled: false },
])

const enabled = computed(() => actions.value.filter(action => !action.disabled))
const activeId = ref<ActionId>(enabled.value[0]?.id ?? 'reset')
const toolbar = ref<HTMLElement | null>(null)

watch(enabled, (list) => {
  const first = list[0]
  if (first && !list.some(action => action.id === activeId.value))
    activeId.value = first.id
}, { immediate: true })

function run(id: ActionId) {
  activeId.value = id
  if (id === 'undo')
    emit('undo')
  else if (id === 'reset')
    emit('reset')
  else
    emit('fit')
}

async function focusAction(id: ActionId) {
  activeId.value = id
  await nextTick()
  toolbar.value?.querySelector<HTMLElement>(`[data-action="${id}"]`)?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const list = enabled.value
  const index = list.findIndex(action => action.id === activeId.value)
  const targets: Record<string, (typeof list)[number] | undefined> = {
    ArrowRight: list[(index + 1) % list.length],
    ArrowLeft: list[(index - 1 + list.length) % list.length],
    Home: list[0],
    End: list.at(-1),
  }
  const next = targets[event.key]
  if (!next)
    return
  event.preventDefault()
  void focusAction(next.id)
}
</script>

<template>
  <div
    ref="toolbar"
    role="toolbar"
    aria-label="Graph tools"
    aria-orientation="horizontal"
    class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
  >
    <span v-for="action in actions" :key="action.id" class="group relative">
      <BaseButton
        variant="ghost"
        icon-only
        :icon="action.icon"
        :label="action.label"
        :disabled="action.disabled"
        :data-action="action.id"
        :tabindex="action.id === activeId ? 0 : -1"
        @focus="activeId = action.id"
        @keydown="onKeydown"
        @click="run(action.id)"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {{ action.label }}
      </span>
    </span>
  </div>
</template>
