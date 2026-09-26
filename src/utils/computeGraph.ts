import type { Edge, Node, XYPosition } from "@vue-flow/core";
import type { FlowItem, FlowNodeData } from "../types";
import { NODE_META } from "./nodeMeta";

const originalPos: XYPosition = { x: 0, y: 0 };

export const computeGraph = (data: FlowItem[]) => {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  data.forEach((flowItem) => {
    nodes.push({
      id: flowItem.id.toString(),
      position: originalPos,
      type: flowItem.type,
      selectable: NODE_META[flowItem.type].selectable,
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
        stroke: NODE_META[parent.type].stroke,
        strokeWidth: 2,
      },
      type: "smoothstep",
      data: flowItem,
    });
  });

  return { nodes, edges };
};
