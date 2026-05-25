"use client";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { PRIORITY_LABELS } from "@/lib/types";
import { cn, formatDueDate } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";

export default function TaskRow({ task }: { task: Doc<"tasks"> }) {
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const done = task.status === "done";

  async function toggleDone() {
    await updateTask({
      id: task._id,
      status: done ? "todo" : "done",
    });
  }

  async function setStatus(status: Doc<"tasks">["status"]) {
    await updateTask({ id: task._id, status });
  }

  return (
    <div className={cn("task-row", done && "task-row-done")}> 
      <button
        type="button"
        onClick={toggleDone}
        className={cn("task-check", done && "task-check-done")}
        aria-label={done ? "Mark task incomplete" : "Mark task done"}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-6", done && "text-[var(--muted)] line-through")}>{task.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => setStatus(e.target.value as Doc<"tasks">["status"])}
            className="select-field text-xs"
          >
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>

          <select
            value={task.priority}
            onChange={(e) => updateTask({ id: task._id, priority: Number(e.target.value) })}
            className="select-field text-xs"
          >
            {[1, 2, 3].map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) =>
              updateTask({
                id: task._id,
                dueDate: e.target.value ? e.target.value : null,
              })
            }
            className="select-field text-xs"
          />
          {task.dueDate && (
            <span className="text-xs text-[var(--muted)]">{formatDueDate(task.dueDate)}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => removeTask({ id: task._id })}
        className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
