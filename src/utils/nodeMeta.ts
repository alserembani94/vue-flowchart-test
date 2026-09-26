import type { FlowItem } from "../types";

type NodeMeta = {
  label: string;
  icon: string;
  text: string;
  /** only selectable nodes get a selected border */
  borderSelected?: string;
  stroke: string;
  /** whether clicking the node (or linking to it via ?node=) opens the drawer */
  selectable: boolean;
};

// class names are written out in full so Tailwind can find them when scanning the source
export const NODE_META: Record<FlowItem["type"], NodeMeta> = {
  trigger: {
    label: "Trigger",
    icon: "pi pi-bolt",
    text: "text-pink-600",
    borderSelected: "border-pink-600",
    stroke: "var(--color-pink-600)",
    selectable: true,
  },
  sendMessage: {
    label: "Send Message",
    icon: "pi pi-send",
    text: "text-emerald-600",
    borderSelected: "border-emerald-600",
    stroke: "var(--color-emerald-600)",
    selectable: true,
  },
  addComment: {
    label: "Add Comment",
    icon: "pi pi-comment",
    text: "text-sky-600",
    borderSelected: "border-sky-600",
    stroke: "var(--color-sky-600)",
    selectable: true,
  },
  dateTime: {
    label: "Business Hours",
    icon: "pi pi-calendar-clock",
    text: "text-orange-600",
    borderSelected: "border-orange-600",
    stroke: "var(--color-orange-600)",
    selectable: true,
  },
  dateTimeConnector: {
    label: "Connector",
    icon: "pi pi-share-alt",
    text: "text-blue-600",
    stroke: "var(--color-orange-600)",
    selectable: false,
  },
};

export function isSelectable(item: FlowItem | undefined): item is FlowItem {
  return !!item && NODE_META[item.type].selectable;
}

/** Display title for an item: its name, or its type label when the item type has no name. */
export function getItemTitle(item: FlowItem): string {
  return "name" in item ? item.name : NODE_META[item.type].label;
}
