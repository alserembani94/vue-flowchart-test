// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { useIndexPage } from "../helpers/indexPage";
import { INSERT_END_COLOR, insertNodeId } from "../../utils/insertPoints";
import { NODE_META } from "../../utils/nodeMeta";
import { INPUT_DEBOUNCE_MS } from "../../utils/constants";

vi.mock("../../api/process", async () => {
  const { flowItems } = await import("../fixtures/flowItems");
  return { getProcesses: vi.fn(async () => structuredClone(flowItems)) };
});

const {
  mountPage, wrapper, store, unmount, pressEnterOn, drawer, drawerTitle,
  titleInput, descriptionInput, card, nodeQuery,
} = useIndexPage();

const insertButton = (parentId: string) =>
  wrapper().get(`.vue-flow__node[data-id="${insertNodeId(parentId)}"] button`);

const form = () => wrapper().get("aside form");

async function openCreateAfter(parentId: string) {
  await insertButton(parentId).trigger("click");
  await flushPromises();
}

async function fillCreateForm({ type = "", title = "", description = "" }) {
  if (type) await wrapper().get('aside select[name="type"]').setValue(type);
  await wrapper().get('aside input[name="title"]').setValue(title);
  await wrapper().get('aside textarea[name="description"]').setValue(description);
}

async function submitCreateForm() {
  await form().trigger("submit");
  await flushPromises();
}

function useFakeTimeouts() {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
}

async function passDebounce() {
  vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
  await flushPromises();
}

afterEach(() => {
  vi.useRealTimers();
  unmount();
});

describe("insert buttons", () => {
  it("renders a labelled + button after insertable nodes", async () => {
    await mountPage();

    expect(insertButton("1").attributes("aria-label")).toBe("Add node after Trigger");
    expect(insertButton("161f52").attributes("aria-label")).toBe("Add node after Success branch of Business Hours");
    expect(insertButton("b0653a").attributes("aria-label")).toBe("Add node after Welcome Message");
    expect(insertButton("b0653a").find("i.pi-plus").exists()).toBe(true);
  });

  it("opens an empty create form in the drawer and moves focus into it", async () => {
    await mountPage("/?node=d09c08");

    await openCreateAfter("b0653a");

    expect(drawerTitle()).toBe("New node");
    expect(nodeQuery()).toBeUndefined();
    expect(wrapper().get<HTMLSelectElement>('aside select[name="type"]').element.value).toBe("");
    expect(document.activeElement).toBe(drawer().element);
  });
});

describe("insert button colors", () => {
  const buttonStyle = (parentId: string) => insertButton(parentId).element as HTMLButtonElement;

  it("matches the parent's edge color between nodes and uses gray at the end, for border and icon", async () => {
    await mountPage();

    expect(buttonStyle("1").style.borderColor).toBe(NODE_META.trigger.stroke);
    expect(buttonStyle("1").style.color).toBe(NODE_META.trigger.stroke);
    expect(buttonStyle("b0653a").style.borderColor).toBe(INSERT_END_COLOR);
    expect(buttonStyle("b0653a").style.color).toBe(INSERT_END_COLOR);
  });

  it("updates when a node is added after it and deleted again", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await fillCreateForm({ type: "sendMessage", title: "Next" });
    await submitCreateForm();
    const id = nodeQuery() as string;

    expect(buttonStyle("b0653a").style.borderColor).toBe(NODE_META.sendMessage.stroke);
    expect(buttonStyle(id).style.borderColor).toBe(INSERT_END_COLOR);

    store().deleteItem(id);
    await flushPromises();

    expect(buttonStyle("b0653a").style.borderColor).toBe(INSERT_END_COLOR);
  });
});

describe("create form context", () => {
  const context = () => wrapper().get("#create-context");

  it("shows the node it will be added after, with its icon", async () => {
    await mountPage();

    await openCreateAfter("b0653a");

    expect(context().text()).toContain("Adding after");
    expect(context().text()).toContain("Welcome Message");
    expect(context().find("i.pi-send").exists()).toBe(true);
  });

  it("names a connector by its branch and condition", async () => {
    await mountPage();

    await openCreateAfter("161f52");

    expect(context().text()).toContain("Success branch of Business Hours");
  });

  it("describes the drawer with the context for screen readers", async () => {
    await mountPage();

    await openCreateAfter("b0653a");

    expect(drawer().attributes("aria-describedby")).toBe("create-context");
  });

  it("marks only the + button whose form is open as active", async () => {
    await mountPage();

    await openCreateAfter("b0653a");

    const active = insertButton("b0653a").element as HTMLButtonElement;
    expect(active.getAttribute("aria-expanded")).toBe("true");
    expect(active.style.backgroundColor).toBe(INSERT_END_COLOR);
    expect(active.style.color).toBe("white");
    expect(insertButton("1").attributes("aria-expanded")).toBe("false");
    expect((insertButton("1").element as HTMLButtonElement).style.backgroundColor).toBe("");
  });

  it("clears the form and updates the context when switching to another +", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await fillCreateForm({ type: "sendMessage", title: "Half typed" });

    await openCreateAfter("1");

    expect(context().text()).toContain("Trigger");
    expect(wrapper().get<HTMLInputElement>('aside input[name="title"]').element.value).toBe("");
    expect(insertButton("1").attributes("aria-expanded")).toBe("true");
    expect(insertButton("b0653a").attributes("aria-expanded")).toBe("false");
  });

  it("notes that next steps move under Success when inserting Business Hours between nodes", async () => {
    await mountPage();
    await openCreateAfter("161f52");

    await wrapper().get('aside select[name="type"]').setValue("businessHours");

    expect(form().text()).toContain("will move under its Success branch");
  });

  it("leaves the note out at the end of the flow or for other types", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await wrapper().get('aside select[name="type"]').setValue("businessHours");

    expect(form().text()).not.toContain("will move under its Success branch");

    await openCreateAfter("161f52");
    await wrapper().get('aside select[name="type"]').setValue("sendMessage");

    expect(form().text()).not.toContain("will move under its Success branch");
  });
});

describe("creating a node", () => {
  it("requires a type and a title", async () => {
    await mountPage();
    await openCreateAfter("b0653a");

    await submitCreateForm();

    expect(form().text()).toContain("Type of node is required");
    expect(form().text()).toContain("Title is required");
    expect(document.activeElement).toBe(wrapper().get('aside select[name="type"]').element);
    expect(store().items).toHaveLength(4);
  });

  it("treats a whitespace-only title as empty", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await fillCreateForm({ type: "sendMessage", title: "   " });

    await submitCreateForm();

    expect(form().text()).toContain("Title is required");
    expect(document.activeElement).toBe(wrapper().get('aside input[name="title"]').element);
  });

  it("adds the node, opens it in the drawer and shows it as a card", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await fillCreateForm({ type: "addComment", title: "  Follow up  ", description: " Later " });

    await submitCreateForm();

    const id = nodeQuery() as string;
    expect(store().itemsById.get(id)).toMatchObject({
      type: "addComment",
      name: "Follow up",
      parentId: "b0653a",
      data: { description: "Later" },
    });
    expect(drawerTitle()).toContain("Add Comment");
    expect(titleInput().value).toBe("Follow up");
    expect(card(id).text()).toContain("Follow up");
    expect(document.activeElement).toBe(drawer().element);
  });

  it("creates Business Hours as a date time node with its connectors", async () => {
    await mountPage();
    await openCreateAfter("b0653a");
    await fillCreateForm({ type: "businessHours", title: "Weekend hours" });

    await submitCreateForm();

    const id = nodeQuery() as string;
    expect(store().itemsById.get(id)).toMatchObject({ type: "dateTime", name: "Weekend hours" });
    expect(store().items.filter((item) => item.parentId.toString() === id)).toHaveLength(2);
  });

  it("closes on Cancel and returns focus to the + button", async () => {
    await mountPage();
    await openCreateAfter("b0653a");

    await wrapper().get("aside form button[type=button]").trigger("click");
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(document.activeElement).toBe(insertButton("b0653a").element);
  });

  it("closes on Escape and returns focus to the + button", async () => {
    await mountPage();
    await openCreateAfter("b0653a");

    await drawer().trigger("keydown", { key: "Escape" });
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(document.activeElement).toBe(insertButton("b0653a").element);
  });

  it("closes the create form when a node is selected", async () => {
    await mountPage();
    await openCreateAfter("b0653a");

    await pressEnterOn("d09c08");

    expect(drawerTitle()).toContain("Date Time");
    expect(wrapper().find("aside form").exists()).toBe(false);
  });
});

describe("editing a node", () => {
  it("saves the title to the store and card after the debounce", async () => {
    await mountPage("/?node=b0653a");
    useFakeTimeouts();

    await wrapper().get('aside input[name="title"]').setValue("Hello  ");
    expect(card("b0653a").text()).toContain("Welcome Message");

    await passDebounce();

    expect(card("b0653a").text()).toContain("Hello");
    expect(titleInput().value).toBe("Hello  ");
  });

  it("does not save an empty title, shows an error, and restores the title on blur", async () => {
    await mountPage("/?node=b0653a");
    useFakeTimeouts();

    await wrapper().get('aside input[name="title"]').setValue("  ");
    await passDebounce();

    expect(drawer().text()).toContain("Title is required");
    expect(titleInput().getAttribute("aria-invalid")).toBe("true");
    expect(card("b0653a").text()).toContain("Welcome Message");

    await wrapper().get('aside input[name="title"]').trigger("blur");

    expect(titleInput().value).toBe("Welcome Message");
  });

  it("saves the trimmed description after the debounce", async () => {
    await mountPage("/?node=b0653a");
    useFakeTimeouts();

    await wrapper().get('aside textarea[name="description"]').setValue("  Greets visitors ");
    expect(card("b0653a").text()).toContain("No description");

    await passDebounce();

    expect(card("b0653a").text()).toContain("Greets visitors");
    expect(descriptionInput().value).toBe("  Greets visitors ");
  });

  it("saves a pending edit to the original node when switching nodes", async () => {
    await mountPage("/?node=b0653a");
    useFakeTimeouts();

    await wrapper().get('aside input[name="title"]').setValue("Renamed");
    await pressEnterOn("d09c08");

    expect(card("b0653a").text()).toContain("Renamed");
    expect(card("d09c08").text()).toContain("Business Hours");
    expect(titleInput().value).toBe("Business Hours");
  });
});

describe("deleting a node", () => {
  it("asks for confirmation and focuses Cancel", async () => {
    await mountPage("/?node=b0653a");

    await wrapper().get("aside section.border-t button").trigger("click");

    expect(drawer().text()).toContain("Delete this node?");
    expect(document.activeElement?.textContent?.trim()).toBe("Cancel");
    expect(store().itemsById.has("b0653a")).toBe(true);
  });

  it("goes back without deleting on Cancel and refocuses the delete button", async () => {
    await mountPage("/?node=b0653a");
    await wrapper().get("aside section.border-t button").trigger("click");

    await wrapper().get('aside [role="group"] button:last-child').trigger("click");

    expect(drawer().text()).not.toContain("Delete this node?");
    expect(document.activeElement?.textContent).toContain("Delete node");
    expect(store().itemsById.has("b0653a")).toBe(true);
  });

  it("deletes on confirm, closes the drawer and focuses the + button where it was", async () => {
    await mountPage("/?node=b0653a");
    await wrapper().get("aside section.border-t button").trigger("click");

    await wrapper().get('aside [role="group"] button:first-child').trigger("click");
    await flushPromises();

    expect(store().itemsById.has("b0653a")).toBe(false);
    expect(wrapper().find('.vue-flow__node[data-id="b0653a"]').exists()).toBe(false);
    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
    expect(document.activeElement).toBe(insertButton("161f52").element);
  });

  it("offers no delete for the trigger", async () => {
    await mountPage("/?node=1");

    expect(drawer().text()).not.toContain("Delete node");
  });
});
