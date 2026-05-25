export type ProjectStatus = "active" | "paused" | "done" | "archived";
export type TaskStatus = "todo" | "doing" | "done";

export const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

export const PROJECT_COLORS = [
  "#5B7553",
  "#7A6B5D",
  "#4A6670",
  "#8B6914",
  "#6B5B7A",
  "#3D6B5E",
];
