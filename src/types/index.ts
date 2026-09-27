type ActionType = "sendMessage" | "addComment" | "businessHours";
type TriggerType = "conversationOpened";

type FlowItemId = number | string;

type CommonAttrs = {
  id: FlowItemId;
  parentId: FlowItemId;
};

export type SendMessagePayload =
  | { type: "text"; text: string }
  | { type: "attachment"; attachment: string };

type SendMessageFlowItem = {
  type: "sendMessage";
  name: string;
  data: {
    payload: SendMessagePayload[];
    description?: string;
  };
} & CommonAttrs;

type AddCommentFlowItem = {
  type: "addComment";
  name: string;
  data: {
    comment: string;
    description?: string;
  };
} & CommonAttrs;

type DateTimeConnectorFlowItem = {
  type: "dateTimeConnector";
  data: {
    connectorType: "failure" | "success";
  };
} & CommonAttrs;

type DateTimeFlowItem = {
  type: "dateTime";
  name: string;
  data: {
    times: {
      startTime: string;
      endTime: string;
      day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    }[];
    connectors: FlowItemId[];
    timezone: string;
    action: "businessHours";
    description?: string;
  };
} & CommonAttrs;

type TriggerFlowItem = {
  type: "trigger";
  data: {
    type: TriggerType;
    oncePerContact: boolean;
  };
} & CommonAttrs;

export type FlowItem =
  | SendMessageFlowItem
  | AddCommentFlowItem
  | DateTimeConnectorFlowItem
  | DateTimeFlowItem
  | TriggerFlowItem;

export type FlowNodeData<T extends FlowItem["type"] = FlowItem["type"]> =
  Extract<FlowItem, { type: T }> & { label: string };

export type Action = {
  title: string;
  description: string;
  type: ActionType;
};
