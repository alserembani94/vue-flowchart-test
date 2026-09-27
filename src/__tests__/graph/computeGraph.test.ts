import { describe, expect, it } from "vitest";
import { computeGraph } from "../../utils/computeGraph";
import { NODE_META } from "../../utils/nodeMeta";
import { flowItems } from "../fixtures/flowItems";
import type { FlowItem } from "../../types";

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

  it("only lets selectable nodes take keyboard focus", () => {
    expect(nodes.map((node) => [node.id, node.focusable])).toEqual([
      ["1", true],
      ["d09c08", true],
      ["161f52", false],
      ["b0653a", true],
    ]);
  });

  it("gives every node an accessible name", () => {
    expect(nodes.map((node) => node.ariaLabel)).toEqual([
      "Trigger",
      "Date Time: Business Hours",
      "Connector",
      "Send Message: Welcome Message",
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

describe("computeGraph node order", () => {
  it("orders nodes top-down (breadth-first) regardless of data order, for Tab order", () => {
    const [trigger, dateTime, connector, message] = flowItems as [FlowItem, FlowItem, FlowItem, FlowItem];
    const { nodes } = computeGraph([message, connector, trigger, dateTime]);

    expect(nodes.map((node) => node.id)).toEqual(["1", "d09c08", "161f52", "b0653a"]);
  });

  it("keeps items that aren't reachable from a root", () => {
    const orphan: FlowItem = {
      id: "loop",
      parentId: "loop",
      type: "addComment",
      name: "Orphan",
      data: { comment: "" },
    };
    const { nodes } = computeGraph([...flowItems, orphan]);

    expect(nodes.at(-1)?.id).toBe("loop");
  });
});
