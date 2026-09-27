import { describe, expect, it } from "vitest";
import { computeGraph } from "../../utils/computeGraph";
import { INSERT_NODE_TYPE, insertNodeId, withInsertPoints } from "../../utils/insertPoints";
import { flowItems } from "../fixtures/flowItems";

const graph = computeGraph(flowItems);
const { nodes, edges } = withInsertPoints(graph.nodes, graph.edges);
const edgePairs = edges.map((edge) => [edge.source, edge.target]);

describe("withInsertPoints", () => {
  it("adds an insert node after trigger, send message, add comment and connector nodes, but not business hours", () => {
    const parents = nodes
      .filter((node) => node.type === INSERT_NODE_TYPE)
      .map((node) => node.data.parentId);

    expect(parents).toEqual(["1", "161f52", "b0653a"]);
  });

  it("places each insert node right after its parent, for Tab order", () => {
    expect(nodes.map((node) => node.id)).toEqual([
      "1",
      insertNodeId("1"),
      "d09c08",
      "161f52",
      insertNodeId("161f52"),
      "b0653a",
      insertNodeId("b0653a"),
    ]);
  });

  it("routes edges through the insert node", () => {
    expect(edgePairs).toContainEqual(["1", insertNodeId("1")]);
    expect(edgePairs).toContainEqual([insertNodeId("1"), "d09c08"]);
    expect(edgePairs).not.toContainEqual(["1", "d09c08"]);
  });

  it("keeps the direct edge from business hours to its connectors", () => {
    expect(edgePairs).toContainEqual(["d09c08", "161f52"]);
  });

  it("makes insert nodes unselectable, unfocusable wrappers that can't be dragged", () => {
    const insert = nodes.find((node) => node.type === INSERT_NODE_TYPE)!;

    expect(insert).toMatchObject({ selectable: false, focusable: false, draggable: false });
  });
});
