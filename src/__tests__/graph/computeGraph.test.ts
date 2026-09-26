import { describe, expect, it } from "vitest";
import { computeGraph } from "../../utils/computeGraph";
import { NODE_META } from "../../utils/nodeMeta";
import { flowItems } from "../fixtures/flowItems";

describe("computeGraph", () => {
  const { nodes, edges } = computeGraph(flowItems);

  it("creates a node per item with string ids", () => {
    expect(nodes.map((node) => node.id)).toEqual([
      "1",
      "d09c08",
      "161f52",
      "b0653a",
    ]);
  });

  it("skips the edge for the root item whose parent isn't in the data", () => {
    expect(edges).toHaveLength(flowItems.length - 1);
    expect(edges.some((edge) => edge.source === "-1")).toBe(false);
  });

  it("points edges from parent to child", () => {
    expect(edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["1", "d09c08"],
      ["d09c08", "161f52"],
      ["161f52", "b0653a"],
    ]);
  });

  it("colors each edge by its parent's type", () => {
    expect(
      edges.map((edge) => (edge.style as { stroke: string }).stroke),
    ).toEqual([
      NODE_META.trigger.stroke,
      NODE_META.dateTime.stroke,
      NODE_META.dateTimeConnector.stroke,
    ]);
  });
});
