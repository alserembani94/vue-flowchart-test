import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import type { FlowItem } from "../types";

export type ContentItem = Extract<FlowItem, { type: "sendMessage" | "addComment" | "dateTime" }>;

export type ItemPatch = {
  name?: string;
  data?: Partial<ContentItem["data"]>;
};

export type NewNodeType = "sendMessage" | "addComment" | "businessHours";

export type NewNodeInput = {
  type: NewNodeType;
  name: string;
  description?: string;
};

export function isContentItem(item: FlowItem | undefined): item is ContentItem {
  return item?.type === "sendMessage" || item?.type === "addComment" || item?.type === "dateTime";
}

const newId = () => crypto.randomUUID();

export const useFlowStore = defineStore("flow", () => {
  const items = ref<FlowItem[]>([]);
  const loaded = ref(false);

  const itemsById = computed(
    () => new Map(items.value.map((item) => [item.id.toString(), item])),
  );

  const structureKey = computed(() =>
    items.value.map((item) => `${item.id}>${item.parentId}`).join("|"),
  );

  function setItems(next: FlowItem[]) {
    items.value = structuredClone(toRaw(next));
    loaded.value = true;
  }

  function childrenOf(id: string) {
    return items.value.filter((item) => item.parentId.toString() === id);
  }

  function updateItem(id: string, patch: ItemPatch): boolean {
    const item = itemsById.value.get(id);
    if (!isContentItem(item)) return false;

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return false;
      item.name = name;
    }

    if (patch.data) {
      const { description, ...rest } = patch.data;
      Object.assign(item.data, rest);

      if ("description" in patch.data) {
        const trimmed = description?.trim();
        if (trimmed) item.data.description = trimmed;
        else delete item.data.description;
      }
    }

    return true;
  }

  function insertItem(input: NewNodeInput, parentId: string): string | null {
    const parent = itemsById.value.get(parentId);
    const name = input.name.trim();
    if (!parent || !name) return null;

    const description = input.description?.trim() || undefined;
    const children = childrenOf(parentId);
    const id = newId();
    const created: FlowItem[] = [];
    let childrenParentId: string = id;

    if (input.type === "sendMessage") {
      created.push({ id, parentId: parent.id, type: "sendMessage", name, data: { payload: [], description } });
    } else if (input.type === "addComment") {
      created.push({ id, parentId: parent.id, type: "addComment", name, data: { comment: "", description } });
    } else {
      const successId = newId();
      const failureId = newId();
      created.push(
        {
          id,
          parentId: parent.id,
          type: "dateTime",
          name,
          data: {
            times: [],
            connectors: [successId, failureId],
            timezone: "UTC",
            action: "businessHours",
            description,
          },
        },
        { id: successId, parentId: id, type: "dateTimeConnector", data: { connectorType: "success" } },
        { id: failureId, parentId: id, type: "dateTimeConnector", data: { connectorType: "failure" } },
      );
      childrenParentId = successId;
    }

    for (const child of children) child.parentId = childrenParentId;
    items.value.push(...created);

    return id;
  }

  function deleteItem(id: string): boolean {
    const item = itemsById.value.get(id);
    if (!item || item.type === "trigger") return false;

    const removed = [item];
    if (item.type === "dateTime") {
      removed.push(...childrenOf(id).filter((child) => child.type === "dateTimeConnector"));
    }

    const removedIds = new Set(removed.map((entry) => entry.id.toString()));
    for (const entry of removed) {
      for (const child of childrenOf(entry.id.toString())) {
        if (!removedIds.has(child.id.toString())) child.parentId = item.parentId;
      }
    }

    items.value = items.value.filter((entry) => !removedIds.has(entry.id.toString()));
    return true;
  }

  return { items, loaded, itemsById, structureKey, setItems, updateItem, insertItem, deleteItem };
});
