type EventType =
  | "trigger"
  | "dateTime"
  | "sendMessage"
  | "addComment"
  | "dateTimeConnector";

export type Event = {
  name?: string;
  id: number;
  parentId: number;
  type: EventType;
  data: {
    type?: string;
    oncePerContact?: boolean;
    payload?: { type: string; text?: string; attachment?: string }[];
    times?: {
      startTime: string;
      endTime: string;
      day: string;
    }[];
    connectors?: string[];
    timezone?: string;
    action?: string;
    connectorType?: string;
    comment?: string;
  };
};
