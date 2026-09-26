import type { Edge, Node, XYPosition } from "@vue-flow/core";
import type { FlowItem } from "../types";

const originalPos: XYPosition = { x: 0, y: 0 };

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

  const ids = new Set(nodes.map((node) => node.id));

  data.forEach((flowItem) => {
    const parentId = flowItem.parentId.toString();
    if (!ids.has(parentId)) return;

    edges.push({
      id: `${parentId}-${flowItem.id}`,
      source: parentId,
      target: flowItem.id.toString(),
    });
  });

  return { nodes, edges };
};
