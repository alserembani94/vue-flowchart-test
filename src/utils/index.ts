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
    edges.push({
      id: `${flowItem.id}-${flowItem.parentId}`,
      source: flowItem.id.toString(),
      target: flowItem.parentId.toString(),
    });
  });

  return { nodes, edges };
};
