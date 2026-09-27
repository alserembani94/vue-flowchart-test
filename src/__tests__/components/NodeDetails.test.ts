// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import NodeDetails from "../../components/NodeDetails.vue";
import type { FlowItem } from "../../types";
import { INPUT_DEBOUNCE_MS } from "../../utils/constants";
import { flowItems } from "../fixtures/flowItems";

const [trigger, dateTime, , message] = structuredClone(flowItems) as [FlowItem, FlowItem, FlowItem, FlowItem];

const comment: FlowItem = {
  id: "c1",
  parentId: "b0653a",
  type: "addComment",
  name: "Note",
  data: { comment: "Off hours message" },
};

const messageWithAttachment: FlowItem = {
  id: "b0653a",
  parentId: "161f52",
  type: "sendMessage",
  name: "Welcome Message",
  data: {
    payload: [
      { type: "text", text: "Hello there" },
      { type: "attachment", attachment: "https://example.com/image.jpg" },
    ],
  },
};

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const renderDetails = (item: FlowItem) => render(NodeDetails, { props: { item } });
const titleInput = () => screen.getByRole("textbox", { name: "Title" });
const descriptionInput = () => screen.getByRole("textbox", { name: "Description" });

describe("content by type", () => {
  it("shows the trigger's settings, without title, description or delete", () => {
    renderDetails(trigger);

    expect(screen.getByText("Conversation Opened")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows message texts and attachment previews", () => {
    renderDetails(messageWithAttachment);

    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Message attachment" })).toHaveAttribute(
      "src",
      "https://example.com/image.jpg",
    );
  });

  it("shows the comment", () => {
    renderDetails(comment);

    expect(screen.getByText("Off hours message")).toBeInTheDocument();
  });

  it("shows the business hours schedule", () => {
    renderDetails(dateTime);

    const row = screen.getByRole("row", { name: "Monday 09:00 17:00" });
    expect(row).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
  });

  it("fills the title and description inputs", () => {
    renderDetails(dateTime);

    expect(titleInput()).toHaveValue("Business Hours");
    expect(descriptionInput()).toHaveValue("Routes by office hours");
  });

  it("leaves the description input empty when there is none", () => {
    renderDetails(message);

    expect(descriptionInput()).toHaveValue("");
  });
});

describe("editing", () => {
  it("emits the title only after the debounce", async () => {
    const { emitted } = renderDetails(message);

    await user.clear(titleInput());
    await user.type(titleInput(), "Hello");
    expect(emitted("update")).toBeUndefined();

    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);

    expect(emitted("update")).toEqual([["b0653a", { name: "Hello", data: undefined }]]);
  });

  it("emits the description after the debounce", async () => {
    const { emitted } = renderDetails(message);

    await user.type(descriptionInput(), "Greets");
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);

    expect(emitted("update")).toEqual([["b0653a", { data: { description: "Greets" } }]]);
  });

  it("shows an error for an empty title, emits nothing and restores the title on blur", async () => {
    const { emitted } = renderDetails(message);

    await user.clear(titleInput());
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);

    expect(titleInput()).toHaveAttribute("aria-invalid", "true");
    expect(titleInput()).toHaveAccessibleDescription("Title is required");
    expect(emitted("update")).toBeUndefined();

    await user.tab();

    expect(titleInput()).toHaveValue("Welcome Message");
    expect(titleInput()).toHaveAttribute("aria-invalid", "false");
  });

  it("sends a pending edit to the previous node when the item changes", async () => {
    const { emitted, rerender } = renderDetails(message);

    await user.clear(titleInput());
    await user.type(titleInput(), "Renamed");
    await rerender({ item: dateTime });

    expect(emitted("update")).toEqual([["b0653a", { name: "Renamed", data: undefined }]]);
    expect(titleInput()).toHaveValue("Business Hours");
  });

  it("sends a pending edit when unmounted", async () => {
    const { emitted, unmount } = renderDetails(message);

    await user.type(descriptionInput(), "Bye");
    unmount();

    expect(emitted("update")).toEqual([["b0653a", { data: { description: "Bye" } }]]);
  });
});

describe("deleting", () => {
  it("asks for confirmation and moves focus to Cancel", async () => {
    const { emitted } = renderDetails(message);

    await user.click(screen.getByRole("button", { name: "Delete node" }));

    expect(screen.getByRole("group", { name: /delete this node/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(emitted("delete")).toBeUndefined();
  });

  it("goes back on Cancel and refocuses the delete button", async () => {
    renderDetails(message);
    await user.click(screen.getByRole("button", { name: "Delete node" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("group", { name: /delete this node/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete node" })).toHaveFocus();
  });

  it("emits delete on confirm, after an edit in progress was saved on blur", async () => {
    const { emitted } = renderDetails(message);
    await user.type(descriptionInput(), "Last words");
    await user.click(screen.getByRole("button", { name: "Delete node" }));

    await user.click(screen.getByRole("button", { name: "Delete" }));
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);

    expect(emitted("update")).toEqual([["b0653a", { data: { description: "Last words" } }]]);
    expect(emitted("delete")).toEqual([["b0653a"]]);
  });
});
