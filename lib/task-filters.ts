import type { Doc } from "@/convex/_generated/dataModel";
import { addDays, format, isBefore, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";

export type TaskWithProject = Doc<"tasks"> & {
  projectName?: string;
  projectColor?: string;
};

export function todayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDueLabel(dueDate: string) {
  try {
    const date = parseISO(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "d MMM");
  } catch {
    return dueDate;
  }
}

export function isOverdue(dueDate: string | undefined) {
  if (!dueDate) return false;
  try {
    return isBefore(parseISO(dueDate), startOfDay(new Date()));
  } catch {
    return false;
  }
}

export function filterOpenTasks(tasks: TaskWithProject[]) {
  return tasks.filter((t) => t.status !== "done");
}

export function filterCompletedTasks(tasks: TaskWithProject[]) {
  return tasks.filter((t) => t.status === "done");
}

export function filterTodayTasks(tasks: TaskWithProject[]) {
  const today = todayIsoDate();
  return filterOpenTasks(tasks).filter(
    (t) => t.dueDate && (t.dueDate <= today || isOverdue(t.dueDate)),
  );
}

export function filterUpcomingTasks(tasks: TaskWithProject[]) {
  const today = todayIsoDate();
  const weekOut = format(addDays(new Date(), 14), "yyyy-MM-dd");
  return filterOpenTasks(tasks).filter(
    (t) => t.dueDate && t.dueDate > today && t.dueDate <= weekOut,
  );
}

export function topLevelTasks(tasks: TaskWithProject[]) {
  return tasks.filter((t) => !t.parentTaskId);
}

export function countOpenTopLevel(tasks: TaskWithProject[]) {
  return topLevelTasks(filterOpenTasks(tasks)).length;
}

export function countCompletedTopLevel(tasks: TaskWithProject[]) {
  return topLevelTasks(filterCompletedTasks(tasks)).length;
}

export type TaskFilter = "all" | "open" | "done";

export function applyTaskFilter(tasks: TaskWithProject[], filter: TaskFilter) {
  if (filter === "open") return filterOpenTasks(tasks);
  if (filter === "done") return filterCompletedTasks(tasks);
  return tasks;
}
