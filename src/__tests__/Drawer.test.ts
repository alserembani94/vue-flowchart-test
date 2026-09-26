// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Drawer from "../components/Drawer.vue";

function pressEscape() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
}

describe("Drawer", () => {
  it("renders nothing while closed", () => {
    const wrapper = mount(Drawer, {
      props: { open: false },
      slots: { default: "Body" },
    });

    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("renders the title and content while open", () => {
    const wrapper = mount(Drawer, {
      props: { open: true, title: "Business Hours" },
      slots: { default: "<p>Body</p>" },
    });

    expect(wrapper.get("#drawer-title").text()).toBe("Business Hours");
    expect(wrapper.get("aside").text()).toContain("Body");
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mount(Drawer, { props: { open: true } });

    await wrapper.get("aside header button").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close on Escape only while open", async () => {
    const wrapper = mount(Drawer, { props: { open: false } });

    pressEscape();
    expect(wrapper.emitted("close")).toBeUndefined();

    await wrapper.setProps({ open: true });
    pressEscape();
    expect(wrapper.emitted("close")).toHaveLength(1);

    await wrapper.setProps({ open: false });
    pressEscape();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
