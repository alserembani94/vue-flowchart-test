import type { Edge, Node, XYPosition } from "@vue-flow/core";
import type { FlowItem } from "../types";

const originalPos: XYPosition = { x: 0, y: 0 };

const EDGE_COLORS: Record<FlowItem["type"], string> = {
  trigger: "var(--color-pink-600)",
  sendMessage: "var(--color-emerald-600)",
  addComment: "var(--color-sky-600)",
  dateTime: "var(--color-orange-600)",
  dateTimeConnector: "var(--color-orange-600)",
};

export const computeGraph = (data: FlowItem[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  data.forEach((flowItem) => {
    nodes.push({
      id: flowItem.id.toString(),
      position: originalPos,
      type: flowItem.type,
      data: { ...flowItem, label: flowItem.type },
    });
  });

  const itemsById = new Map(data.map((item) => [item.id.toString(), item]));

  data.forEach((flowItem) => {
    const parent = itemsById.get(flowItem.parentId.toString());
    if (!parent) return;

    edges.push({
      id: `${parent.id}-${flowItem.id}`,
      source: parent.id.toString(),
      target: flowItem.id.toString(),
      style: {
        stroke: EDGE_COLORS[parent.type],
        strokeWidth: 2,
      },
      type: "smoothstep",
      data: flowItem,
    });
  });

  return { nodes, edges };
};
