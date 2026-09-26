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

    const rankSize = new Map<number, number>();
    for (const id of dagreGraph.nodes()) {
      const { x, y, width, height } = dagreGraph.node(id);
      const rank = isHorizontal ? x : y;
      rankSize.set(
        rank,
        Math.max(rankSize.get(rank) ?? 0, isHorizontal ? width : height),
      );
    }

    return nodes.map((node) => {
      const { x, y, width, height } = dagreGraph.node(node.id);

      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: isHorizontal
          ? { x: x - rankSize.get(x)! / 2, y: y - height / 2 }
          : { x: x - width / 2, y: y - rankSize.get(y)! / 2 },
      };
    });
  }

  return { graph, layout, previousDirection };
}
