"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import TaskRow from "./task-row";

function sortTasks(tasks: Doc<"tasks">[]) {
  return [...tasks].sort((a, b) => {
    const order = { doing: 0, todo: 1, done: 2 } as const;
    const statusDiff = order[a.status] - order[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.sortOrder - b.sortOrder;
  });
}

export default function TaskList({ tasks }: { tasks: Doc<"tasks">[] }) {
  const sorted = sortTasks(tasks);
  const doing = sorted.filter((t) => t.status === "doing");
  const todo = sorted.filter((t) => t.status === "todo");
  const done = sorted.filter((t) => t.status === "done");

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--muted)]">
        No tasks yet. Add one below.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {doing.length > 0 && (
        <section>
          <h2 className="section-label">Doing</h2>
          <div className="space-y-2">
            {doing.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </div>
        </section>
      )}

      {todo.length > 0 && (
        <section>
          <h2 className="section-label">To do</h2>
          <div className="space-y-2">
            {todo.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--muted)]">
            Done ({done.length})
          </summary>
          <div className="mt-3 space-y-2">
            {done.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
