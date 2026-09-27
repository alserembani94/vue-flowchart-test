import { vi } from "vitest";
import { defineComponent, h, type PropType } from "vue";
import { render } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import type { Node, NodeChange } from "@vue-flow/core";
import IndexPage from "../../pages/index.vue";
import { useFlowStore } from "../../stores/flow";

vi.mock("../../api/process", async () => {
  const { flowItems } = await import("../fixtures/flowItems");
  return { getProcesses: vi.fn(async () => structuredClone(flowItems)) };
});

let emitFlow: ((event: string, ...args: unknown[]) => void) | undefined;

const SELECTION_KEYS = ["Enter", " ", "Escape"];

type NodeElement = HTMLElement & { flowNode: Node; flowEventsBound?: boolean };

const VueFlowStub = defineComponent({
  name: "VueFlow",
  props: { nodes: { type: Array as PropType<Node[]>, default: () => [] } },
  emits: ["nodeClick", "nodesChange", "paneClick", "nodesInitialized"],
  setup(props, { slots, emit }) {
    emitFlow = emit as typeof emitFlow;

    const select = (node: Node) => {
      if (node.selectable !== false) emit("nodesChange", [{ id: node.id, type: "select", selected: true }]);
    };

    const bindNodeEvents = (element: NodeElement | null, node: Node) => {
      if (!element) return;
      element.flowNode = node;
      if (element.flowEventsBound) return;

      element.flowEventsBound = true;
      element.addEventListener("click", () => {
        select(element.flowNode);
        emit("nodeClick", { node: element.flowNode });
      });
      element.addEventListener("keydown", (event) => {
        if (event.target === element && SELECTION_KEYS.includes(event.key)) select(element.flowNode);
      });
    };

    return () =>
      h("div", [
        h("div", { "data-testid": "flow-pane", onClick: () => emit("paneClick") }),
        ...props.nodes.map((node) => {
          const focusable = node.focusable !== false;
          return h(
            "div",
            {
              class: "vue-flow__node",
              "data-id": node.id,
              role: focusable ? "group" : undefined,
              tabindex: focusable ? 0 : undefined,
              "aria-roledescription": "node",
              "aria-label": node.ariaLabel,
              ref: (element) => bindNodeEvents(element as NodeElement | null, node),
            },
            slots[`node-${node.type}`]?.({ id: node.id, type: node.type, data: node.data, selected: false }),
          );
        }),
      ]);
  },
});

export function emitNodesChange(changes: NodeChange[]) {
  emitFlow?.("nodesChange", changes);
  return flushPromises();
}

export async function renderIndexPage(url = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: IndexPage }],
  });
  await router.push(url);
  await router.isReady();

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const pinia = createPinia();

  render(IndexPage, {
    global: {
      plugins: [router, pinia, [VueQueryPlugin, { queryClient }]],
      stubs: { VueFlow: VueFlowStub },
    },
  });
  await flushPromises();

  const events = userEvent.setup({ delay: null });
  const settled = <A extends unknown[]>(action: (...args: A) => Promise<unknown>) =>
    async (...args: A) => {
      await action(...args);
      await flushPromises();
    };

  return {
    user: {
      click: settled(events.click),
      keyboard: settled(events.keyboard),
      type: settled(events.type),
      clear: settled(events.clear),
      selectOptions: settled(events.selectOptions),
    },
    router,
    queryClient,
    store: useFlowStore(pinia),
    nodeQuery: () => router.currentRoute.value.query.node,
  };
}
