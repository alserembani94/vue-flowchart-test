import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { readonly } from "vue";
import { useFlowStore } from "../../stores/flow";
import { flowItems } from "../fixtures/flowItems";

let flow: ReturnType<typeof useFlowStore>;

const item = (id: string) => flow.itemsById.get(id)!;
const parentOf = (id: string) => item(id).parentId.toString();

beforeEach(() => {
  setActivePinia(createPinia());
  flow = useFlowStore();
  flow.setItems(structuredClone(flowItems));
});

describe("setItems", () => {
  it("keeps its own editable copy, even of read-only query data", () => {
    const source = structuredClone(flowItems);
    flow.setItems(readonly(source) as typeof source);

    expect(flow.updateItem("b0653a", { name: "Edited" })).toBe(true);
    expect(item("b0653a")).toMatchObject({ name: "Edited" });
    expect(source[3]).toMatchObject({ name: "Welcome Message" });
  });
});

describe("updateItem", () => {
  it("trims and saves the title", () => {
    expect(flow.updateItem("b0653a", { name: "  Hi there  " })).toBe(true);
    expect(item("b0653a")).toMatchObject({ name: "Hi there" });
  });

  it("rejects an empty title and keeps the old one", () => {
    expect(flow.updateItem("b0653a", { name: "   " })).toBe(false);
    expect(item("b0653a")).toMatchObject({ name: "Welcome Message" });
  });

  it("trims the description and merges it into data", () => {
    flow.updateItem("b0653a", { data: { description: "  Greets visitors " } });

    expect(item("b0653a").data).toEqual({
      payload: [{ type: "text", text: "Hello there" }],
      description: "Greets visitors",
    });
  });

  it("removes the description when it's cleared", () => {
    flow.updateItem("d09c08", { data: { description: "  " } });

    expect(item("d09c08").data).not.toHaveProperty("description");
  });

  it("ignores items without a title", () => {
    expect(flow.updateItem("1", { name: "Renamed" })).toBe(false);
    expect(flow.updateItem("161f52", { name: "Renamed" })).toBe(false);
  });
});

describe("insertItem", () => {
  it("adds a node at the end when the parent has no children", () => {
    const id = flow.insertItem({ type: "addComment", name: " Note ", description: " Why " }, "b0653a")!;

    expect(item(id)).toMatchObject({
      type: "addComment",
      name: "Note",
      data: { comment: "", description: "Why" },
    });
    expect(parentOf(id)).toBe("b0653a");
  });

  it("inserts between a parent and its children", () => {
    const id = flow.insertItem({ type: "sendMessage", name: "Between" }, "161f52")!;

    expect(parentOf(id)).toBe("161f52");
    expect(parentOf("b0653a")).toBe(id);
  });

  it("creates Business Hours with success and failure connectors and moves children under success", () => {
    const id = flow.insertItem({ type: "businessHours", name: "Hours" }, "161f52")!;
    const dateTime = item(id);
    if (dateTime.type !== "dateTime") throw new Error("expected dateTime");

    const [successId, failureId] = dateTime.data.connectors.map(String) as [string, string];
    expect(item(successId)).toMatchObject({ type: "dateTimeConnector", data: { connectorType: "success" } });
    expect(item(failureId)).toMatchObject({ type: "dateTimeConnector", data: { connectorType: "failure" } });
    expect(parentOf(successId)).toBe(id);
    expect(parentOf(failureId)).toBe(id);
    expect(parentOf("b0653a")).toBe(successId);
  });

  it("rejects an empty title or an unknown parent", () => {
    expect(flow.insertItem({ type: "sendMessage", name: "  " }, "b0653a")).toBeNull();
    expect(flow.insertItem({ type: "sendMessage", name: "Ok" }, "missing")).toBeNull();
    expect(flow.items).toHaveLength(flowItems.length);
  });
});

describe("deleteItem", () => {
  it("moves the deleted node's children up to its parent", () => {
    const id = flow.insertItem({ type: "sendMessage", name: "Between" }, "161f52")!;

    expect(flow.deleteItem(id)).toBe(true);

    expect(flow.itemsById.has(id)).toBe(false);
    expect(parentOf("b0653a")).toBe("161f52");
  });

  it("removes Business Hours' connectors and moves their children up", () => {
    expect(flow.deleteItem("d09c08")).toBe(true);

    expect(flow.itemsById.has("d09c08")).toBe(false);
    expect(flow.itemsById.has("161f52")).toBe(false);
    expect(parentOf("b0653a")).toBe("1");
  });

  it("does not delete the trigger", () => {
    expect(flow.deleteItem("1")).toBe(false);
    expect(flow.itemsById.has("1")).toBe(true);
  });
});
