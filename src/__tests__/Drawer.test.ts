// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Drawer from "../components/Drawer.vue";

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

  it("emits close on Escape inside the drawer", async () => {
    const wrapper = mount(Drawer, { props: { open: true } });

    await wrapper.get("aside").trigger("keydown", { key: "Escape" });

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("ignores Escape pressed outside the drawer", () => {
    const wrapper = mount(Drawer, { props: { open: true } });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("names the panel by its title and labels the close button", () => {
    const wrapper = mount(Drawer, { props: { open: true, title: "Business Hours" } });

    expect(wrapper.get("aside").attributes("aria-labelledby")).toBe("drawer-title");
    expect(wrapper.get("aside header button").attributes("aria-label")).toBe("Close");
  });

  it("moves focus to the panel with focus()", () => {
    const wrapper = mount(Drawer, { props: { open: true }, attachTo: document.body });

    (wrapper.vm as unknown as { focus: () => void }).focus();

    expect(document.activeElement).toBe(wrapper.get("aside").element);
    wrapper.unmount();
  });
});
