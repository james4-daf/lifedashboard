"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { FolderKanban, RotateCcw } from "lucide-react";

function deletedLabel(deletedAt: number) {
  return formatDistanceToNow(deletedAt, { addSuffix: true });
}

export default function DeletedItemsPanel() {
  const deletedItems = useQuery(api.tasks.listDeleted);
  const restoreTask = useMutation(api.tasks.restore);
  const restoreProject = useMutation(api.projects.restore);

  return (
    <div className="panel-main">
      <div className="panel-content">
        <p className="panel-breadcrumb">Recently deleted</p>
        <h1 className="panel-title">Recently deleted</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Restore tasks or projects you removed by mistake.
        </p>

        {deletedItems === undefined ? (
          <p className="py-12 text-sm text-[var(--muted)]">Loading...</p>
        ) : deletedItems.length === 0 ? (
          <p className="py-12 text-sm text-[var(--muted)]">Nothing in the trash.</p>
        ) : (
          <ul className="mt-8 divide-y divide-[var(--border)]">
            {deletedItems.map((item) => {
              if (item.kind === "project") {
                return (
                  <li key={`project-${item._id}`} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                          <span
                            className="sidebar-project-icon"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate font-medium">{item.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Project · {item.taskCount} task{item.taskCount === 1 ? "" : "s"} · deleted{" "}
                          {deletedLabel(item.deletedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void restoreProject({ id: item._id })}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li key={`task-${item._id}`} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-base",
                          item.status === "done" && "text-[var(--muted)] line-through",
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle"
                          style={{ backgroundColor: item.projectColor }}
                        />
                        {item.projectName} · deleted {deletedLabel(item.deletedAt!)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void restoreTask({ id: item._id as Id<"tasks"> })}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
