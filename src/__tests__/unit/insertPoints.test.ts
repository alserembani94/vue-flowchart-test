import { describe, expect, it } from "vitest";
import { computeGraph } from "../../utils/computeGraph";
import { INSERT_END_COLOR, INSERT_NODE_TYPE, insertNodeId, withInsertPoints } from "../../utils/insertPoints";
import { NODE_META } from "../../utils/nodeMeta";
import { flowItems } from "../fixtures/flowItems";

const graph = computeGraph(flowItems);
const { nodes, edges } = withInsertPoints(graph.nodes, graph.edges);
const edgePairs = edges.map((edge) => [edge.source, edge.target]);
const insertColor = (parentId: string) => nodes.find((node) => node.id === insertNodeId(parentId))?.data.color;
const edgeStroke = (source: string, target: string) =>
  (edges.find((edge) => edge.source === source && edge.target === target)?.style as { stroke: string }).stroke;

describe("withInsertPoints", () => {
  it("adds an insert node right after trigger, send message, add comment and connector nodes, but not business hours", () => {
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

  it("colors an insert point between nodes, and both its edges, like the parent's edge", () => {
    expect(insertColor("1")).toBe(NODE_META.trigger.stroke);
    expect(edgeStroke("1", insertNodeId("1"))).toBe(NODE_META.trigger.stroke);
    expect(edgeStroke(insertNodeId("1"), "d09c08")).toBe(NODE_META.trigger.stroke);

    expect(insertColor("161f52")).toBe(NODE_META.dateTimeConnector.stroke);
    expect(edgeStroke("161f52", insertNodeId("161f52"))).toBe(NODE_META.dateTimeConnector.stroke);
  });

  it("colors an insert point at the end of the flow, and its edge, gray", () => {
    expect(insertColor("b0653a")).toBe(INSERT_END_COLOR);
    expect(edgeStroke("b0653a", insertNodeId("b0653a"))).toBe(INSERT_END_COLOR);
  });

  it("dashes the edge to an insert point at the end of the flow only", () => {
    const dash = (source: string, target: string) =>
      (edges.find((edge) => edge.source === source && edge.target === target)?.style as { strokeDasharray?: string })
        .strokeDasharray;

    expect(dash("b0653a", insertNodeId("b0653a"))).toBe("6 4");
    expect(dash("1", insertNodeId("1"))).toBeUndefined();
    expect(dash(insertNodeId("1"), "d09c08")).toBeUndefined();
  });
});
