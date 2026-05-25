"use client";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDueDate } from "@/lib/utils";
import { useMutation } from "convex/react";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import QuickAddTask from "./quick-add-task";

type ProjectWithMeta = Doc<"projects"> & {
  openTaskCount: number;
  hasOverdue: boolean;
  nextTask: {
    _id: Doc<"tasks">["_id"];
    title: string;
    status: Doc<"tasks">["status"];
    priority: number;
    dueDate?: string;
  } | null;
};

export default function ProjectCard({ project }: { project: ProjectWithMeta }) {
  const updateTask = useMutation(api.tasks.update);

  async function markNextDone() {
    if (!project.nextTask) return;
    await updateTask({ id: project.nextTask._id, status: "done" });
  }

  return (
    <article className="card group">
      <div className="flex items-start gap-4">
        <div
          className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link href={`/projects/${project._id}`} className="font-display text-xl text-[var(--foreground)] hover:underline">
                {project.name}
              </Link>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {project.openTaskCount === 0
                  ? "No open tasks"
                  : `${project.openTaskCount} open ${project.openTaskCount === 1 ? "task" : "tasks"}`}
                {project.status === "paused" && " · paused"}
              </p>
            </div>
            <Link
              href={`/projects/${project._id}`}
              className="rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              aria-label={`Open ${project.name}`}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {project.hasOverdue && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-xs font-medium text-[var(--danger)]">
              <AlertCircle className="h-3.5 w-3.5" />
              Has overdue tasks
            </div>
          )}

          {project.nextTask ? (
            <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Next up
              </p>
              <div className="mt-2 flex items-start gap-3">
                <button
                  type="button"
                  onClick={markNextDone}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-[var(--border-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                  aria-label="Mark next task done"
                />
                <div className="min-w-0">
                  <p className="text-sm leading-6 text-[var(--foreground)]">{project.nextTask.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {project.nextTask.status === "doing" ? "In progress" : "To do"}
                    {project.nextTask.dueDate && ` · due ${formatDueDate(project.nextTask.dueDate)}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">All caught up in this project.</p>
          )}

          <QuickAddTask projectId={project._id} />
        </div>
      </div>
    </article>
  );
}
