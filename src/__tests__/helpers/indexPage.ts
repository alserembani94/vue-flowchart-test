import { defineComponent, h, type PropType } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter, type Router } from "vue-router";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, type Pinia } from "pinia";
import type { Node } from "@vue-flow/core";
import IndexPage from "../../pages/index.vue";
import { useFlowStore } from "../../stores/flow";

export const VueFlowStub = defineComponent({
  name: "VueFlow",
  props: { nodes: { type: Array as PropType<Node[]>, default: () => [] } },
  emits: ["nodeClick", "nodesChange", "paneClick", "nodesInitialized"],
  setup: (props, { slots }) => () =>
    h(
      "div",
      { "data-test": "vue-flow" },
      props.nodes.map((node) =>
        h(
          "div",
          {
            class: "vue-flow__node",
            "data-id": node.id,
            tabindex: node.focusable === false ? undefined : 0,
          },
          slots[`node-${node.type}`]?.({ id: node.id, type: node.type, data: node.data, selected: false }),
        ),
      ),
    ),
});

export function useIndexPage() {
  let router: Router;
  let wrapper: VueWrapper;
  let queryClient: QueryClient;
  let pinia: Pinia;

  async function mountPage(url = "/") {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: IndexPage }],
    });
    await router.push(url);
    await router.isReady();

    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    pinia = createPinia();

    wrapper = mount(IndexPage, {
      attachTo: document.body,
      global: {
        plugins: [router, pinia, [VueQueryPlugin, { queryClient }]],
        stubs: { VueFlow: VueFlowStub },
      },
    });
    await flushPromises();
  }

  const flow = () => wrapper.findComponent(VueFlowStub);
  const nodeElement = (id: string) =>
    wrapper.get<HTMLElement>(`.vue-flow__node[data-id="${id}"]`).element;

  function isSelectableNode(id: string) {
    const nodes = flow().props("nodes") as Node[];
    return nodes.find((node) => node.id === id)?.selectable !== false;
  }

  async function clickNode(id: string) {
    nodeElement(id).focus();
    if (isSelectableNode(id)) {
      flow().vm.$emit("nodesChange", [{ id, type: "select", selected: true }]);
    }
    flow().vm.$emit("nodeClick", { node: { id } });
    await flushPromises();
  }

  async function pressEnterOn(id: string) {
    nodeElement(id).focus();
    flow().vm.$emit("nodesChange", [{ id, type: "select", selected: true }]);
    await flushPromises();
  }

  async function emitDeselect(id: string) {
    flow().vm.$emit("nodesChange", [{ id, type: "select", selected: false }]);
    await flushPromises();
  }

  async function clickPane() {
    flow().vm.$emit("paneClick");
    await flushPromises();
  }

  return {
    mountPage,
    router: () => router,
    wrapper: () => wrapper,
    queryClient: () => queryClient,
    store: () => useFlowStore(pinia),
    unmount: () => wrapper?.unmount(),
    flow,
    nodeElement,
    clickNode,
    pressEnterOn,
    emitDeselect,
    clickPane,
    drawer: () => wrapper.find("aside"),
    drawerTitle: () => wrapper.get("#drawer-title").text(),
    titleInput: () => wrapper.get<HTMLInputElement>('aside input[name="title"]').element,
    descriptionInput: () => wrapper.get<HTMLTextAreaElement>('aside textarea[name="description"]').element,
    card: (id: string) => wrapper.get(`.vue-flow__node[data-id="${id}"]`),
    nodeQuery: () => router.currentRoute.value.query.node,
  };
}
