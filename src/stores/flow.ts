import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { FlowItem } from "../types";

export const useFlowStore = defineStore("flow", () => {
  const items = ref<FlowItem[]>([]);
  const loaded = ref(false);

  const itemsById = computed(
    () => new Map(items.value.map((item) => [item.id.toString(), item])),
  );

  function setItems(next: FlowItem[]) {
    items.value = next;
    loaded.value = true;
  }

  return { items, loaded, itemsById, setItems };
});
