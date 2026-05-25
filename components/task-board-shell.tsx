"use client";

import CombinedTaskList from "@/components/combined-task-list";
import ProgressBar from "@/components/progress-bar";
import ProjectsSidebar from "@/components/projects-sidebar";
import SortableTaskList from "@/components/sortable-task-list";
import TaskFilterTabs from "@/components/task-filter-tabs";
import type { TaskWithProject } from "@/lib/task-filters";
import { applyTaskFilter, type TaskFilter, topLevelTasks } from "@/lib/task-filters";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Menu, Plus, Trash2 } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";

type TaskBoardShellProps = {
  breadcrumb: string;
  title: string;
  titleEditable?: boolean;
  onTitleSave?: (value: string) => void;
  doneCount?: number;
  totalCount?: number;
  addPlaceholder: string;
  onAddTask: (title: string) => Promise<void>;
  addExtra?: ReactNode;
  tasks?: Doc<"tasks">[] | null;
  projectId?: Id<"projects">;
  combinedTasks?: TaskWithProject[] | null;
  showProjectLabel?: boolean;
  emptyMessage: string;
  onDeleteProject?: () => void;
  deleteLabel?: string;
};

export default function TaskBoardShell({
  breadcrumb,
  title,
  titleEditable,
  onTitleSave,
  doneCount,
  totalCount,
  addPlaceholder,
  onAddTask,
  addExtra,
  tasks,
  projectId,
  combinedTasks,
  showProjectLabel,
  emptyMessage,
  onDeleteProject,
  deleteLabel,
}: TaskBoardShellProps) {
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const isLoading = tasks === undefined && combinedTasks === undefined;
  const sourceTasks: TaskWithProject[] = combinedTasks ?? tasks ?? [];
  const openTasks = sourceTasks.filter((t) => t.status !== "done");
  const doneTasks = sourceTasks.filter((t) => t.status === "done");
  const hasAny = sourceTasks.length > 0;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask(newTitle.trim());
    setNewTitle("");
  }

  function renderCombinedList(taskSet: TaskWithProject[]) {
    return <CombinedTaskList tasks={taskSet} showProjectLabel={showProjectLabel} />;
  }

  function renderProjectList(statusFilter: "open" | "done") {
    if (!projectId || !tasks) return null;
    return (
      <SortableTaskList
        projectId={projectId}
        allTasks={tasks}
        statusFilter={statusFilter}
      />
    );
  }

  return (
    <div className="panel-main">
      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div className="h-full w-72 bg-[var(--surface)]" onClick={(e) => e.stopPropagation()}>
            <ProjectsSidebar />
          </div>
        </div>
      )}

      <div className="panel-content">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setShowMobileSidebar(true)}
              className="icon-btn mb-3 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="panel-breadcrumb">{breadcrumb}</p>
            {titleEditable && onTitleSave ? (
              <input
                key={title}
                defaultValue={title}
                onBlur={(e) => void onTitleSave(e.target.value)}
                className="panel-title w-full bg-transparent outline-none"
              />
            ) : (
              <h1 className="panel-title">{title}</h1>
            )}
            {doneCount !== undefined && totalCount !== undefined && totalCount > 0 && (
              <div className="mt-4 max-w-md">
                <ProgressBar done={doneCount} total={totalCount} />
              </div>
            )}
          </div>
          <TaskFilterTabs value={filter} onChange={setFilter} />
        </div>

        <form onSubmit={handleAdd} className="add-task-row mt-8">
          <Plus className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          {addExtra}
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={addPlaceholder}
            className="input-ghost flex-1"
          />
        </form>

        {isLoading ? (
          <p className="py-12 text-sm text-[var(--muted)]">Loading...</p>
        ) : !hasAny ? (
          <p className="py-12 text-sm text-[var(--muted)]">{emptyMessage}</p>
        ) : filter === "done" ? (
          topLevelTasks(doneTasks).length === 0 ? (
            <p className="py-8 text-sm text-[var(--muted)]">No completed tasks yet.</p>
          ) : (
            <div className="mt-2">
              {combinedTasks !== undefined
                ? renderCombinedList(applyTaskFilter(sourceTasks, "done"))
                : renderProjectList("done")}
            </div>
          )
        ) : (
          <>
            <div className="mt-2">
              {topLevelTasks(openTasks).length === 0 ? (
                <p className="py-8 text-sm text-[var(--muted)]">No open tasks.</p>
              ) : combinedTasks !== undefined ? (
                renderCombinedList(applyTaskFilter(openTasks, filter))
              ) : (
                renderProjectList("open")
              )}
            </div>
            {filter === "all" && topLevelTasks(doneTasks).length > 0 && (
              <div className="mt-8">
                <p className="section-label mb-3">
                  {topLevelTasks(doneTasks).length} completed
                </p>
                {combinedTasks !== undefined
                  ? renderCombinedList(doneTasks)
                  : renderProjectList("done")}
              </div>
            )}
          </>
        )}

        {onDeleteProject && (
          <button
            type="button"
            onClick={onDeleteProject}
            className={cn(
              "mt-16 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--danger)]",
            )}
          >
            <Trash2 className="h-4 w-4" />
            {deleteLabel ?? "Delete project"}
          </button>
        )}
      </div>
    </div>
  );
}
