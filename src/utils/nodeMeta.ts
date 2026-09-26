import type { FlowItem } from "../types";

type NodeMeta = {
  label: string;
  icon: string;
  text: string;
  ringSelected?: string;
  ringFocus?: string;
  stroke: string;
  selectable: boolean;
};

export const NODE_META: Record<FlowItem["type"], NodeMeta> = {
  trigger: {
    label: "Trigger",
    icon: "pi pi-bolt",
    text: "text-pink-600",
    ringSelected: "ring-2 ring-pink-600",
    ringFocus: "in-focus-visible:ring-2 in-focus-visible:ring-pink-300",
    stroke: "var(--color-pink-600)",
    selectable: true,
  },
  sendMessage: {
    label: "Send Message",
    icon: "pi pi-send",
    text: "text-emerald-600",
    ringSelected: "ring-2 ring-emerald-600",
    ringFocus: "in-focus-visible:ring-2 in-focus-visible:ring-emerald-300",
    stroke: "var(--color-emerald-600)",
    selectable: true,
  },
  addComment: {
    label: "Add Comment",
    icon: "pi pi-comment",
    text: "text-sky-600",
    ringSelected: "ring-2 ring-sky-600",
    ringFocus: "in-focus-visible:ring-2 in-focus-visible:ring-sky-300",
    stroke: "var(--color-sky-600)",
    selectable: true,
  },
  dateTime: {
    label: "Business Hours",
    icon: "pi pi-calendar-clock",
    text: "text-orange-600",
    ringSelected: "ring-2 ring-orange-600",
    ringFocus: "in-focus-visible:ring-2 in-focus-visible:ring-orange-300",
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

export function getItemTitle(item: FlowItem): string {
  return "name" in item ? item.name : NODE_META[item.type].label;
}

export function getItemAriaLabel(item: FlowItem): string {
  const label = NODE_META[item.type].label;
  const title = getItemTitle(item);
  return title === label ? label : `${label}: ${title}`;
}
