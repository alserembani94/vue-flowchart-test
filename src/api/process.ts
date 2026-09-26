import type { FlowItem } from "../types";

export const getProcesses = async (): Promise<FlowItem> => {
  const response = await fetch("/api/processes");

  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.status}`);
  }

  return (await response.json()) as FlowItem;
};
