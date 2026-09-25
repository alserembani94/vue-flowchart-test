type ActionType = "sendMessage" | "addComment" | "businessHours";
type TriggerType = "conversationOpened";

type NodeId = number | string;

type CommonAttrs = {
  id: NodeId;
  name?: string;
  parentId: NodeId;
};

type SendMessagePayload =
  | { type: "text"; text: string }
  | { type: "attachment"; attachent: string };

type SendMessageNode = {
  type: "sendMessage";
  data: {
    payload: SendMessagePayload;
  };
} & CommonAttrs;

type AddCommentNode = {
  type: "addComment";
  data: {
    comment: string;
  };
} & CommonAttrs;

type DateTimeConnectorNode = {
  type: "dateTimeConnector";
  data: {
    connectorType: "failure" | "success";
  };
} & CommonAttrs;

type DateTimeNode = {
  type: "dateTime";
  data: {
    times: {
      startTime: string;
      endTime: string;
      day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    }[];
    connectors: NodeId[];
    timezone: string;
    action: "businessHours";
  };
} & CommonAttrs;

type TriggerNode = {
  type: "trigger";
  data: {
    type: TriggerType;
    oncePerContact: boolean;
  };
} & CommonAttrs;

export type Node =
  | SendMessageNode
  | AddCommentNode
  | DateTimeConnectorNode
  | DateTimeNode
  | TriggerNode;

export type Action = {
  title: string;
  description: string;
  type: ActionType;
};
