import type { SendMessagePayload } from "../types";

export function getMessagePreview(payload: SendMessagePayload[]): string {
  const text = payload.find((item) => item.type === "text");
  if (text) return text.text;

  const attachment = payload.find((item) => item.type === "attachment");
  return attachment ? attachment.attachment : "";
}
