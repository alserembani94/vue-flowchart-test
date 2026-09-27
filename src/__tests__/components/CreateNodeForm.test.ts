// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import CreateNodeForm from "../../components/CreateNodeForm.vue";

const BUSINESS_HOURS_NOTE = "The steps after this point will move under its Success branch.";

function renderForm(props: { hasNextSteps?: boolean } = {}) {
  const user = userEvent.setup();
  const result = render(CreateNodeForm, {
    props: { afterName: "Welcome Message", afterIcon: "pi pi-send text-emerald-600", hasNextSteps: false, ...props },
  });
  return { user, ...result };
}

const typeSelect = () => screen.getByRole("combobox", { name: "Type of node" });
const titleInput = () => screen.getByRole("textbox", { name: "Title" });
const submit = () => screen.getByRole("button", { name: "Add new node" });

describe("CreateNodeForm", () => {
  it("shows where the node will be added, with the parent's icon", () => {
    const { container } = renderForm();

    expect(screen.getByText("Adding after")).toBeInTheDocument();
    expect(screen.getByText("Welcome Message")).toBeInTheDocument();
    expect(container.querySelector("#create-context i")).toHaveClass("pi", "pi-send");
  });

  it("starts with no type selected", () => {
    renderForm();

    expect(typeSelect()).toHaveValue("");
  });

  it("requires a type and a title, and focuses the type first", async () => {
    const { user, emitted } = renderForm();

    await user.click(submit());

    expect(typeSelect()).toHaveAccessibleDescription("Type of node is required");
    expect(titleInput()).toHaveAccessibleDescription("Title is required");
    expect(typeSelect()).toHaveFocus();
    expect(emitted("submit")).toBeUndefined();
  });

  it("treats a whitespace-only title as empty and focuses it", async () => {
    const { user, emitted } = renderForm();
    await user.selectOptions(typeSelect(), "sendMessage");
    await user.type(titleInput(), "   ");

    await user.click(submit());

    expect(titleInput()).toHaveAttribute("aria-invalid", "true");
    expect(titleInput()).toHaveFocus();
    expect(emitted("submit")).toBeUndefined();
  });

  it("emits the entered values on submit", async () => {
    const { user, emitted } = renderForm();
    await user.selectOptions(typeSelect(), "addComment");
    await user.type(titleInput(), " Follow up ");
    await user.type(screen.getByRole("textbox", { name: "Description" }), "Later");

    await user.click(submit());

    expect(emitted("submit")).toEqual([[{ type: "addComment", name: " Follow up ", description: "Later" }]]);
  });

  it("emits cancel", async () => {
    const { user, emitted } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(emitted("cancel")).toHaveLength(1);
  });

  it("notes that next steps move under Success for Business Hours when there are next steps", async () => {
    const { user } = renderForm({ hasNextSteps: true });

    await user.selectOptions(typeSelect(), "businessHours");

    expect(screen.getByText(BUSINESS_HOURS_NOTE)).toBeInTheDocument();
  });

  it("leaves the note out without next steps or for other types", async () => {
    const { user, rerender } = renderForm({ hasNextSteps: false });
    await user.selectOptions(typeSelect(), "businessHours");

    expect(screen.queryByText(BUSINESS_HOURS_NOTE)).not.toBeInTheDocument();

    await rerender({ hasNextSteps: true });
    await user.selectOptions(typeSelect(), "sendMessage");

    expect(screen.queryByText(BUSINESS_HOURS_NOTE)).not.toBeInTheDocument();
  });
});
