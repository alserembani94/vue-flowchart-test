// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/vue";
import NodeCard from "../../components/NodeCard.vue";
import { NODE_META } from "../../utils/nodeMeta";

const renderCard = (props: Partial<InstanceType<typeof NodeCard>["$props"]> = {}) =>
  render(NodeCard, {
    props: { type: "sendMessage", icon: NODE_META.sendMessage.icon, title: "Welcome Message", ...props },
  });

describe("NodeCard", () => {
  it("shows the title, the description and the icon", () => {
    const { container } = renderCard({ description: "Greets visitors" });

    expect(screen.getByText("Welcome Message")).toBeInTheDocument();
    expect(screen.getByText("Greets visitors")).toBeInTheDocument();
    expect(container.querySelector("i")).toHaveClass("pi", "pi-send", NODE_META.sendMessage.text);
  });

  it("shows a placeholder when there is no description", () => {
    renderCard({ description: "" });

    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("uses the selected ring when selected", () => {
    const card = renderCard({ selected: true }).container.firstElementChild;

    expect(card).toHaveClass(...NODE_META.sendMessage.ringSelected!.split(" "));
    expect(card).not.toHaveClass(...NODE_META.sendMessage.ringFocus!.split(" "));
  });

  it("uses the focus ring when not selected", () => {
    const card = renderCard({ selected: false }).container.firstElementChild;

    expect(card).toHaveClass(...NODE_META.sendMessage.ringFocus!.split(" "));
    expect(card).not.toHaveClass(...NODE_META.sendMessage.ringSelected!.split(" "));
  });
});
