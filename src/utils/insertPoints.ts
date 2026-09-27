import type { Edge, Node } from "@vue-flow/core";
import type { FlowItem } from "../types";
import { NODE_META } from "./nodeMeta";

export const INSERT_NODE_TYPE = "insert";

export const INSERT_END_COLOR = "var(--color-gray-600)";

const INSERT_AFTER = new Set<FlowItem["type"]>(["trigger", "sendMessage", "addComment", "dateTimeConnector"]);

export type InsertNodeData = { parentId: string; color: string };

export const insertNodeId = (parentId: string) => `insert:${parentId}`;

export function withInsertPoints(nodes: Node[], edges: Edge[]) {
  const parentsWithChildren = new Set(edges.map((edge) => edge.source));
  const insertAfter = new Map<string, { id: string; color: string; isEnd: boolean }>();
  const composedNodes: Node[] = [];

  for (const node of nodes) {
    composedNodes.push(node);
    if (!INSERT_AFTER.has(node.type as FlowItem["type"])) continue;

    const id = insertNodeId(node.id);
    const isEnd = !parentsWithChildren.has(node.id);
    const color = isEnd ? INSERT_END_COLOR : NODE_META[node.type as FlowItem["type"]].stroke;

    insertAfter.set(node.id, { id, color, isEnd });
    composedNodes.push({
      id,
      type: INSERT_NODE_TYPE,
      position: node.position,
      selectable: false,
      focusable: false,
      draggable: false,
      data: { parentId: node.id, color } satisfies InsertNodeData,
    });
  }

  const composedEdges: Edge[] = edges.map((edge) => {
    const insert = insertAfter.get(edge.source);
    return insert ? { ...edge, id: `${insert.id}-${edge.target}`, source: insert.id } : edge;
  });

  for (const [parentId, { id, color, isEnd }] of insertAfter) {
    composedEdges.push({
      id: `${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      style: { stroke: color, strokeWidth: 2, ...(isEnd && { strokeDasharray: "6 4" }) },
    });
  }

  return { nodes: composedNodes, edges: composedEdges };
}
