// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { useIndexPage } from "../helpers/indexPage";

vi.mock("../../api/process", async () => {
  const { flowItems } = await import("../fixtures/flowItems");
  return { getProcesses: vi.fn(async () => structuredClone(flowItems)) };
});

const {
  mountPage, router, wrapper, queryClient, unmount, nodeElement, clickNode, pressEnterOn,
  emitDeselect, clickPane, drawer, drawerTitle, titleInput, descriptionInput, card, nodeQuery,
} = useIndexPage();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  unmount();
});

describe("selecting nodes", () => {
  it("keeps the drawer closed when nothing is selected", async () => {
    await mountPage();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("opens the drawer and writes ?node= when a selectable node is clicked", async () => {
    await mountPage();

    await clickNode("d09c08");

    expect(nodeQuery()).toBe("d09c08");
    expect(drawerTitle()).toContain("Date Time");
    expect(titleInput().value).toBe("Business Hours");
    expect(drawer().text()).toContain("UTC");
  });

  it("opens the drawer when a node is selected with the keyboard", async () => {
    await mountPage();

    await pressEnterOn("b0653a");

    expect(nodeQuery()).toBe("b0653a");
    expect(titleInput().value).toBe("Welcome Message");
  });

  it("swaps the content when another node is clicked while open", async () => {
    await mountPage();

    await clickNode("d09c08");
    await clickNode("b0653a");

    expect(nodeQuery()).toBe("b0653a");
    expect(titleInput().value).toBe("Welcome Message");
    expect(drawer().text()).toContain("Hello there");
  });

  it("uses replace, so selecting nodes doesn't add history entries", async () => {
    await mountPage();
    const push = vi.spyOn(router(), "push");
    const replace = vi.spyOn(router(), "replace");

    await clickNode("d09c08");
    await clickNode("b0653a");

    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(2);
  });

  it("does not open the drawer for a connector", async () => {
    await mountPage();

    await clickNode("161f52");

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("closes the drawer when a connector is clicked while open", async () => {
    await mountPage();
    await clickNode("d09c08");

    await clickNode("161f52");

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("closes the drawer when Vue Flow deselects the open node", async () => {
    await mountPage("/?node=d09c08");

    await emitDeselect("d09c08");

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("ignores the old node being deselected after switching to a new one", async () => {
    await mountPage();
    await clickNode("d09c08");
    await clickNode("b0653a");

    await emitDeselect("d09c08");

    expect(nodeQuery()).toBe("b0653a");
    expect(titleInput().value).toBe("Welcome Message");
  });
});

describe("node content", () => {
  it("maps each card's title to the item name", async () => {
    await mountPage();

    expect(card("d09c08").text()).toContain("Business Hours");
    expect(card("b0653a").text()).toContain("Welcome Message");
  });

  it("shows the item description on the card", async () => {
    await mountPage();

    expect(card("d09c08").text()).toContain("Routes by office hours");
  });

  it("shows a placeholder on the card when there is no description", async () => {
    await mountPage();

    expect(card("b0653a").text()).toContain("No description");
  });

  it("shows the type, title and description in the drawer", async () => {
    await mountPage("/?node=d09c08");

    expect(drawerTitle()).toContain("Date Time");
    expect(titleInput().value).toBe("Business Hours");
    expect(descriptionInput().value).toBe("Routes by office hours");
  });

  it("leaves the description input empty when there is none", async () => {
    await mountPage("/?node=b0653a");

    expect(drawerTitle()).toContain("Send Message");
    expect(descriptionInput().value).toBe("");
  });

  it("has no title or description inputs for the trigger", async () => {
    await mountPage("/?node=1");

    expect(drawerTitle()).toContain("Trigger");
    expect(wrapper().find('aside input[name="title"]').exists()).toBe(false);
  });

  it("keeps the store's items when the query data changes again", async () => {
    await mountPage();

    queryClient().setQueryData(["processes"], []);
    await flushPromises();

    expect(card("d09c08").text()).toContain("Business Hours");
  });
});

describe("closing the drawer", () => {
  it("closes on pane click", async () => {
    await mountPage("/?node=d09c08");

    await clickPane();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("closes with the close button", async () => {
    await mountPage("/?node=d09c08");

    await wrapper().get("aside header button").trigger("click");
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("closes with Escape inside the drawer", async () => {
    await mountPage("/?node=d09c08");

    await drawer().trigger("keydown", { key: "Escape" });
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("keeps other query params when closing", async () => {
    await mountPage("/?node=d09c08&foo=bar");

    await clickPane();

    expect(router().currentRoute.value.query).toEqual({ foo: "bar" });
  });
});

describe("focus", () => {
  it("moves focus into the drawer when it opens", async () => {
    await mountPage();

    await pressEnterOn("d09c08");

    expect(document.activeElement).toBe(drawer().element);
  });

  it("moves focus into the drawer when switching to another node", async () => {
    await mountPage();
    await pressEnterOn("d09c08");

    await pressEnterOn("b0653a");

    expect(document.activeElement).toBe(drawer().element);
  });

  it("returns focus to the node on Escape", async () => {
    await mountPage();
    await pressEnterOn("d09c08");

    await drawer().trigger("keydown", { key: "Escape" });
    await flushPromises();

    expect(document.activeElement).toBe(nodeElement("d09c08"));
  });

  it("returns focus to the node when the close button is used", async () => {
    await mountPage();
    await pressEnterOn("d09c08");

    await wrapper().get("aside header button").trigger("click");
    await flushPromises();

    expect(document.activeElement).toBe(nodeElement("d09c08"));
  });

  it("does not move focus to the node on pane click", async () => {
    await mountPage();
    await pressEnterOn("d09c08");

    await clickPane();

    expect(document.activeElement).not.toBe(nodeElement("d09c08"));
  });

  it("closes on Escape from a node and keeps focus there, before Vue Flow sees the key", async () => {
    await mountPage();
    await pressEnterOn("d09c08");
    const node = nodeElement("d09c08");
    const vueFlowHandler = vi.fn();
    node.addEventListener("keydown", vueFlowHandler);
    node.focus();

    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(document.activeElement).toBe(node);
    expect(vueFlowHandler).not.toHaveBeenCalled();
  });

  it("keeps Escape from Vue Flow after closing, so a second press doesn't reselect the node", async () => {
    await mountPage();
    await pressEnterOn("d09c08");
    await drawer().trigger("keydown", { key: "Escape" });
    await flushPromises();
    const node = nodeElement("d09c08");
    const vueFlowHandler = vi.fn();
    node.addEventListener("keydown", vueFlowHandler);

    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();

    expect(vueFlowHandler).not.toHaveBeenCalled();
    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
    expect(document.activeElement).toBe(node);
  });

  it("only makes selectable nodes focusable", async () => {
    await mountPage();

    expect(nodeElement("d09c08").getAttribute("tabindex")).toBe("0");
    expect(nodeElement("161f52").hasAttribute("tabindex")).toBe(false);
  });
});

describe("deep links", () => {
  it("opens the drawer for a selectable node in the URL", async () => {
    await mountPage("/?node=b0653a");

    expect(nodeQuery()).toBe("b0653a");
    expect(titleInput().value).toBe("Welcome Message");
  });

  it("moves focus into the drawer once the data has loaded", async () => {
    await mountPage("/?node=b0653a");

    expect(document.activeElement).toBe(drawer().element);
  });

  it("removes a connector id from the URL and keeps the drawer closed", async () => {
    await mountPage("/?node=161f52");

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("removes an unknown id from the URL", async () => {
    await mountPage("/?node=does-not-exist&foo=bar");

    expect(drawer().exists()).toBe(false);
    expect(router().currentRoute.value.query).toEqual({ foo: "bar" });
  });

  it("ignores a repeated ?node= param", async () => {
    await mountPage("/?node=d09c08&node=b0653a");

    expect(drawer().exists()).toBe(false);
  });
});
