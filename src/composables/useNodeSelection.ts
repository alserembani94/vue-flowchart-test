import type { Node, NodeChange } from '@vue-flow/core'
import type { Ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlowStore } from '../stores/flow'
import { isSelectable } from '../utils/nodeMeta'

export interface SelectionGuard {
  hasUnsavedChanges: () => boolean
  confirmLeave: () => boolean
}

const noGuard: SelectionGuard = {
  hasUnsavedChanges: () => false,
  confirmLeave: () => true,
}

export function useNodeSelection(nodes: Ref<Node[]>, guard: SelectionGuard = noGuard) {
  const flow = useFlowStore()
  const route = useRoute()
  const router = useRouter()
  const { findNode, getSelectedNodes, addSelectedNodes, removeSelectedNodes } = useVueFlow()

  const selectedId = computed<string | null>({
    get: () => {
      const node = route.query.node
      return typeof node === 'string' && node ? node : null
    },
    set: (id) => {
      if (id === selectedId.value)
        return
      void router.replace({ query: { ...route.query, node: id ?? undefined } })
    },
  })

  const selectedItem = computed(() => {
    const item = selectedId.value !== null ? flow.itemsById.get(selectedId.value) : undefined
    return isSelectable(item) ? item : null
  })

  watch([selectedId, () => flow.loaded], ([id, loaded]) => {
    if (id !== null && loaded && !selectedItem.value)
      selectedId.value = null
  })

  function syncSelection() {
    const node = selectedId.value !== null ? findNode(selectedId.value) : undefined
    const stale = getSelectedNodes.value.filter(selected => selected.id !== node?.id)

    if (stale.length)
      removeSelectedNodes(stale)
    if (node && !node.selected)
      addSelectedNodes([node])
  }

  watch([selectedId, nodes], syncSelection, { flush: 'post' })

  function onNodesChange(changes: NodeChange[]) {
    const selects = changes.filter(change => change.type === 'select')
    const selected = selects.find(
      change => change.selected && isSelectable(flow.itemsById.get(change.id)),
    )

    if (selected) {
      const leaving = selectedId.value !== null && selected.id !== selectedId.value
      if (leaving && !guard.confirmLeave()) {
        void nextTick(syncSelection)
        return
      }
      selectedId.value = selected.id
    }
    else if (selects.some(change => !change.selected && change.id === selectedId.value)) {
      if (guard.hasUnsavedChanges()) {
        void nextTick(syncSelection)
        return
      }
      selectedId.value = null
    }
  }

  return { selectedId, selectedItem, onNodesChange }
}
