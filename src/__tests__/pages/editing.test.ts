// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { renderIndexPage } from "../helpers/indexPage";
import { INSERT_END_COLOR } from "../../utils/insertPoints";
import { NODE_META } from "../../utils/nodeMeta";
import { INPUT_DEBOUNCE_MS } from "../../utils/constants";

type Page = Awaited<ReturnType<typeof renderIndexPage>>;

const AFTER_WELCOME = "Add node after Welcome Message";
const AFTER_SUCCESS = "Add node after Success branch of Business Hours";
const AFTER_TRIGGER = "Add node after Trigger";

const insertButton = (name: string) => screen.getByRole("button", { name });
const node = (name: string) => screen.getByRole("group", { name });
const drawer = () => screen.queryByRole("complementary");
const drawerHeading = () => within(screen.getByRole("complementary")).getByRole("heading", { level: 2 });
const typeSelect = () => screen.getByRole("combobox", { name: "Type of node" });
const titleInput = () => screen.getByRole("textbox", { name: "Title" });
const businessHoursNote = () => screen.queryByText(/will move under its Success branch/);

async function fillAndSubmit(user: Page["user"], { type, title, description = "" }: { type: string; title: string; description?: string }) {
  await user.selectOptions(typeSelect(), type);
  await user.type(titleInput(), title);
  if (description) await user.type(screen.getByRole("textbox", { name: "Description" }), description);
  await user.click(screen.getByRole("button", { name: "Add new node" }));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("insert buttons", () => {
  it("renders a + button labelled with the node it follows", async () => {
    await renderIndexPage();

    expect(insertButton(AFTER_SUCCESS)).toContainElement(insertButton(AFTER_SUCCESS).querySelector("i.pi-plus"));
  });

  it("opens an empty create form in the drawer and moves focus into it", async () => {
    const { user, nodeQuery } = await renderIndexPage("/?node=d09c08");

    await user.click(insertButton(AFTER_WELCOME));

    expect(drawerHeading()).toHaveTextContent("New node");
    expect(nodeQuery()).toBeUndefined();
    expect(typeSelect()).toHaveValue("");
    expect(drawer()).toHaveFocus();
  });

  it("uses the parent's edge color between nodes and gray at the end, for border and icon", async () => {
    await renderIndexPage();

    expect(insertButton(AFTER_TRIGGER).style.borderColor).toBe(NODE_META.trigger.stroke);
    expect(insertButton(AFTER_TRIGGER).style.color).toBe(NODE_META.trigger.stroke);
    expect(insertButton(AFTER_WELCOME).style.borderColor).toBe(INSERT_END_COLOR);
    expect(insertButton(AFTER_WELCOME).style.color).toBe(INSERT_END_COLOR);
  });

  it("recolors when a node is added after it and deleted again", async () => {
    const { user, store, nodeQuery } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));
    await fillAndSubmit(user, { type: "sendMessage", title: "Next" });

    expect(insertButton(AFTER_WELCOME).style.borderColor).toBe(NODE_META.sendMessage.stroke);
    expect(insertButton("Add node after Next").style.borderColor).toBe(INSERT_END_COLOR);

    store.deleteItem(nodeQuery() as string);
    await flushPromises();

    expect(insertButton(AFTER_WELCOME).style.borderColor).toBe(INSERT_END_COLOR);
  });
});

describe("create form context", () => {
  it("describes the drawer with the node it will be added after", async () => {
    const { user } = await renderIndexPage();

    await user.click(insertButton(AFTER_WELCOME));

    expect(drawer()).toHaveAccessibleDescription("Adding after Welcome Message");
    expect(document.querySelector("#create-context i")).toHaveClass("pi-send");
  });

  it("marks only the + button whose form is open as active", async () => {
    const { user } = await renderIndexPage();

    await user.click(insertButton(AFTER_WELCOME));

    expect(insertButton(AFTER_WELCOME)).toHaveAttribute("aria-expanded", "true");
    expect(insertButton(AFTER_WELCOME).style.backgroundColor).toBe(INSERT_END_COLOR);
    expect(insertButton(AFTER_WELCOME).style.color).toBe("white");
    expect(insertButton(AFTER_TRIGGER)).toHaveAttribute("aria-expanded", "false");
    expect(insertButton(AFTER_TRIGGER).style.backgroundColor).toBe("");
  });

  it("clears the form and updates the context when switching to another +", async () => {
    const { user } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));
    await user.type(titleInput(), "Half typed");

    await user.click(insertButton(AFTER_TRIGGER));

    expect(drawer()).toHaveAccessibleDescription("Adding after Trigger");
    expect(titleInput()).toHaveValue("");
    expect(insertButton(AFTER_TRIGGER)).toHaveAttribute("aria-expanded", "true");
    expect(insertButton(AFTER_WELCOME)).toHaveAttribute("aria-expanded", "false");
  });

  it("tells the form whether the spot has next steps, for the Business Hours note", async () => {
    const { user } = await renderIndexPage();

    await user.click(insertButton(AFTER_SUCCESS));
    await user.selectOptions(typeSelect(), "businessHours");
    expect(businessHoursNote()).toBeInTheDocument();

    await user.click(insertButton(AFTER_WELCOME));
    await user.selectOptions(typeSelect(), "businessHours");
    expect(businessHoursNote()).not.toBeInTheDocument();
  });
});

describe("creating a node", () => {
  it("adds the node, opens it in the drawer and shows it as a card", async () => {
    const { user, store, nodeQuery } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));

    await fillAndSubmit(user, { type: "addComment", title: "  Follow up  ", description: " Later " });

    expect(store.itemsById.get(nodeQuery() as string)).toMatchObject({
      type: "addComment",
      name: "Follow up",
      parentId: "b0653a",
      data: { description: "Later" },
    });
    expect(drawerHeading()).toHaveTextContent("Add Comment");
    expect(titleInput()).toHaveValue("Follow up");
    expect(node("Add Comment: Follow up")).toBeInTheDocument();
    expect(drawer()).toHaveFocus();
  });

  it("closes on Cancel and returns focus to the + button", async () => {
    const { user } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(drawer()).not.toBeInTheDocument();
    expect(insertButton(AFTER_WELCOME)).toHaveFocus();
  });

  it("closes on Escape and returns focus to the + button", async () => {
    const { user } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));

    await user.keyboard("{Escape}");

    expect(drawer()).not.toBeInTheDocument();
    expect(insertButton(AFTER_WELCOME)).toHaveFocus();
  });

  it("closes the create form when a node is selected", async () => {
    const { user } = await renderIndexPage();
    await user.click(insertButton(AFTER_WELCOME));

    await user.click(node("Date Time: Business Hours"));

    expect(drawerHeading()).toHaveTextContent("Date Time");
    expect(screen.queryByRole("button", { name: "Add new node" })).not.toBeInTheDocument();
  });
});

describe("editing a node", () => {
  it("saves the title to the store and card after the debounce", async () => {
    const { user } = await renderIndexPage("/?node=b0653a");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    await user.clear(titleInput());
    await user.type(titleInput(), "Hello");
    expect(node("Send Message: Welcome Message")).toBeInTheDocument();

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
    await flushPromises();

    expect(screen.getByText("Hello").closest('[data-id="b0653a"]')).toBeInTheDocument();
  });
});

describe("deleting a node", () => {
  it("deletes on confirm, closes the drawer and focuses the + button where it was", async () => {
    const { user, store, nodeQuery } = await renderIndexPage("/?node=b0653a");

    await user.click(screen.getByRole("button", { name: "Delete node" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(store.itemsById.has("b0653a")).toBe(false);
    expect(screen.queryByRole("group", { name: "Send Message: Welcome Message" })).not.toBeInTheDocument();
    expect(drawer()).not.toBeInTheDocument();
    expect(nodeQuery()).toBeUndefined();
    expect(insertButton(AFTER_SUCCESS)).toHaveFocus();
  });
});
