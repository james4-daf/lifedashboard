import { format, parseISO } from "date-fns";

export function formatDueDate(date: string | undefined) {
  if (!date) return null;
  try {
    return format(parseISO(date), "MMM d");
  } catch {
    return date;
  }
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
