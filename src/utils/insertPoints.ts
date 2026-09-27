import type { Edge, Node } from "@vue-flow/core";
import type { FlowItem } from "../types";
import { NODE_META } from "./nodeMeta";

export const INSERT_NODE_TYPE = "insert";

const INSERT_AFTER = new Set<FlowItem["type"]>(["trigger", "sendMessage", "addComment", "dateTimeConnector"]);

export type InsertNodeData = { parentId: string };

export const insertNodeId = (parentId: string) => `insert:${parentId}`;

export function withInsertPoints(nodes: Node[], edges: Edge[]) {
  const insertAfter = new Map<string, string>();
  const composedNodes: Node[] = [];

  for (const node of nodes) {
    composedNodes.push(node);
    if (!INSERT_AFTER.has(node.type as FlowItem["type"])) continue;

    const id = insertNodeId(node.id);
    insertAfter.set(node.id, id);
    composedNodes.push({
      id,
      type: INSERT_NODE_TYPE,
      position: node.position,
      selectable: false,
      focusable: false,
      draggable: false,
      data: { parentId: node.id } satisfies InsertNodeData,
    });
  }

  const composedEdges: Edge[] = edges.map((edge) => {
    const insertId = insertAfter.get(edge.source);
    return insertId ? { ...edge, id: `${insertId}-${edge.target}`, source: insertId } : edge;
  });

  for (const [parentId, insertId] of insertAfter) {
    const parent = nodes.find((node) => node.id === parentId)!;
    composedEdges.push({
      id: `${parentId}-${insertId}`,
      source: parentId,
      target: insertId,
      type: "smoothstep",
      style: { stroke: NODE_META[parent.type as FlowItem["type"]].stroke, strokeWidth: 2 },
    });
  }

  return { nodes: composedNodes, edges: composedEdges };
}
