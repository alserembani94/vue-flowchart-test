// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import IndexPage from "../../pages/index.vue";

vi.mock("../../api/process", async () => {
  const { flowItems } = await import("../fixtures/flowItems");
  return { getProcesses: vi.fn(async () => flowItems) };
});

const VueFlowStub = defineComponent({
  name: "VueFlow",
  emits: ["nodeClick", "paneClick", "nodesInitialized"],
  setup: () => () => h("div", { "data-test": "vue-flow" }),
});

let router: Router;
let wrapper: VueWrapper;

async function mountPage(url = "/") {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: IndexPage }],
  });
  await router.push(url);
  await router.isReady();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  wrapper = mount(IndexPage, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient }]],
      stubs: { VueFlow: VueFlowStub },
    },
  });
  await flushPromises();
}

async function clickNode(id: string) {
  wrapper.findComponent(VueFlowStub).vm.$emit("nodeClick", { node: { id } });
  await flushPromises();
}

async function clickPane() {
  wrapper.findComponent(VueFlowStub).vm.$emit("paneClick");
  await flushPromises();
}

const drawer = () => wrapper.find("aside");
const drawerTitle = () => wrapper.get("#drawer-title").text();
const nodeQuery = () => router.currentRoute.value.query.node;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  wrapper?.unmount();
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
    expect(drawerTitle()).toContain("Business Hours");
    expect(drawer().text()).toContain("UTC");
  });

  it("swaps the content when another node is clicked while open", async () => {
    await mountPage();

    await clickNode("d09c08");
    await clickNode("b0653a");

    expect(nodeQuery()).toBe("b0653a");
    expect(drawerTitle()).toContain("Welcome Message");
    expect(drawer().text()).toContain("Hello there");
  });

  it("uses replace, so selecting nodes doesn't add history entries", async () => {
    await mountPage();
    const push = vi.spyOn(router, "push");
    const replace = vi.spyOn(router, "replace");

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

    await wrapper.get("aside header button").trigger("click");
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("closes with Escape", async () => {
    await mountPage("/?node=d09c08");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("keeps other query params when closing", async () => {
    await mountPage("/?node=d09c08&foo=bar");

    await clickPane();

    expect(router.currentRoute.value.query).toEqual({ foo: "bar" });
  });
});

describe("deep links", () => {
  it("opens the drawer for a selectable node in the URL", async () => {
    await mountPage("/?node=b0653a");

    expect(nodeQuery()).toBe("b0653a");
    expect(drawerTitle()).toContain("Welcome Message");
  });

  it("removes a connector id from the URL and keeps the drawer closed", async () => {
    await mountPage("/?node=161f52");

    expect(drawer().exists()).toBe(false);
    expect(nodeQuery()).toBeUndefined();
  });

  it("removes an unknown id from the URL", async () => {
    await mountPage("/?node=does-not-exist&foo=bar");

    expect(drawer().exists()).toBe(false);
    expect(router.currentRoute.value.query).toEqual({ foo: "bar" });
  });

  it("ignores a repeated ?node= param", async () => {
    await mountPage("/?node=d09c08&node=b0653a");

    expect(drawer().exists()).toBe(false);
  });
});
