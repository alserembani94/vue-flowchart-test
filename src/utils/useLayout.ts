import dagre from "@dagrejs/dagre";
import { Position, useVueFlow, type Edge, type Node } from "@vue-flow/core";
import { ref, shallowRef } from "vue";

export type LayoutDirection = "LR" | "RL" | "TB" | "BT";

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

export function useLayout() {
  const { findNode } = useVueFlow();

  const graph = shallowRef(new dagre.graphlib.Graph());

  const previousDirection = ref<LayoutDirection>("LR");

  function layout<T extends Node>(
    nodes: T[],
    edges: Edge[],
    direction: LayoutDirection,
  ): T[] {
    const dagreGraph = new dagre.graphlib.Graph();

    graph.value = dagreGraph;

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === "LR" || direction === "RL";
    dagreGraph.setGraph({ rankdir: direction });

    previousDirection.value = direction;

    for (const node of nodes) {
      const graphNode = findNode(node.id);

      dagreGraph.setNode(node.id, {
        width: graphNode?.dimensions.width || DEFAULT_NODE_WIDTH,
        height: graphNode?.dimensions.height || DEFAULT_NODE_HEIGHT,
      });
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target);
    }

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id);

      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: { x, y },
      };
    });
  }

  return { graph, layout, previousDirection };
}
