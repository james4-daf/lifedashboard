"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDueLabel, isOverdue } from "@/lib/task-filters";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  CornerDownRight,
  FileText,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import SortableTaskList from "./sortable-task-list";

export type TaskItemCoreProps = {
  task: Doc<"tasks">;
  allTasks: Doc<"tasks">[];
  projectId: Id<"projects">;
  depth?: number;
  showProjectLabel?: { name: string; color: string };
  dragHandle?: React.ReactNode;
  containerRef?: (node: HTMLElement | null) => void;
  containerStyle?: React.CSSProperties;
  isDragging?: boolean;
  onUpdate: (args: {
    id: Id<"tasks">;
    title?: string;
    notes?: string;
    status?: Doc<"tasks">["status"];
    dueDate?: string | null;
  }) => Promise<void>;
  onDelete: (id: Id<"tasks">) => Promise<void>;
  onCreate: (args: {
    title: string;
    parentTaskId?: Id<"tasks">;
  }) => Promise<void>;
};

export function TaskItemCore({
  task,
  allTasks,
  projectId,
  depth = 0,
  showProjectLabel,
  dragHandle,
  containerRef,
  containerStyle,
  isDragging = false,
  onUpdate,
  onDelete,
  onCreate,
}: TaskItemCoreProps) {
  const subtasks = allTasks
    .filter((t) => t.parentTaskId === task._id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const doneSubtasks = subtasks.filter((t) => t.status === "done").length;
  const done = task.status === "done";
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [notesOpen, setNotesOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingTitle) {
      setTitleDraft(task.title);
    }
  }, [task.title, editingTitle]);

  useEffect(() => {
    if (!editingTitle) return;
    const input = titleInputRef.current;
    if (!input) return;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, [editingTitle]);

  async function toggleDone() {
    if (!done) {
      setJustCompleted(true);
      window.setTimeout(() => setJustCompleted(false), 450);
    }
    await onUpdate({ id: task._id, status: done ? "todo" : "done" });
  }

  function startEditingTitle() {
    setTitleDraft(task.title);
    setEditingTitle(true);
  }

  function handleRowClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-edit]")) return;
    if (editingTitle) return;
    startEditingTitle();
  }

  async function saveTitle() {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title);
      return;
    }
    await onUpdate({ id: task._id, title: trimmed });
  }

  async function handleAddSubtask(event: FormEvent) {
    event.preventDefault();
    if (!subtaskTitle.trim()) return;
    await onCreate({ title: subtaskTitle.trim(), parentTaskId: task._id });
    setSubtaskTitle("");
    setAddingSubtask(false);
  }

  async function handleDelete(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm(`Delete "${task.title}"?`)) return;
    setEditingTitle(false);
    await onDelete(task._id);
  }

  const dueLabel = task.dueDate ? formatDueLabel(task.dueDate) : null;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={cn(
        "group task-item",
        done && "task-item-done",
        isDragging && "task-item-dragging",
        justCompleted && "task-item-completed-flash",
      )}
    >
      <div
        className={cn(
          "task-item-inner",
          editingTitle && "task-item-inner-active",
        )}
        style={{ paddingLeft: depth > 0 ? `${8 + depth * 16}px` : undefined }}
        onClick={handleRowClick}
      >
        {dragHandle}

        <button
          type="button"
          data-no-edit
          onClick={toggleDone}
          className={cn("task-check", done && "task-check-done task-check-pop")}
          aria-label={done ? "Mark incomplete" : "Mark complete"}
        >
          {done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          {showProjectLabel && (
            <Link
              href={`/projects/${task.projectId}`}
              data-no-edit
              className="mb-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <span
                className="sidebar-project-icon"
                style={{ backgroundColor: showProjectLabel.color }}
              />
              {showProjectLabel.name}
            </Link>
          )}

          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(task.title);
                  setEditingTitle(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "task-title-input",
                done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]",
              )}
            />
          ) : (
            <span
              className={cn(
                "task-title-display",
                done
                  ? "text-[var(--muted)] line-through"
                  : "text-[var(--foreground)]",
              )}
            >
              {task.title}
            </span>
          )}

          {!done && (
            <div
              className={cn(
                "task-meta",
                (editingTitle ||
                  notesOpen ||
                  dueOpen ||
                  addingSubtask ||
                  task.dueDate ||
                  task.notes ||
                  subtasks.length > 0) &&
                  "task-meta-visible",
              )}
            >
              <button
                type="button"
                data-no-edit
                onClick={(e) => {
                  e.stopPropagation();
                  setDueOpen((v) => !v);
                }}
                className={cn(
                  "task-meta-item",
                  task.dueDate && "task-meta-active",
                  overdue && "text-[var(--danger)]",
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                {dueLabel ?? "Due date"}
              </button>

              {subtasks.length > 0 && (
                <span className="task-meta-item pointer-events-none">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  {doneSubtasks} / {subtasks.length}
                </span>
              )}

              <button
                type="button"
                data-no-edit
                onClick={(e) => {
                  e.stopPropagation();
                  setNotesOpen((v) => !v);
                }}
                className={cn("task-meta-item", task.notes && "task-meta-active")}
              >
                <FileText className="h-3.5 w-3.5" />
                note
              </button>

              {!done && subtasks.length === 0 && (
                <button
                  type="button"
                  data-no-edit
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingSubtask(true);
                  }}
                  className="task-meta-item"
                >
                  <Plus className="h-3.5 w-3.5" />
                  subtask
                </button>
              )}

              {editingTitle && (
                <button
                  type="button"
                  data-no-edit
                  onClick={handleDelete}
                  className="task-meta-item task-meta-delete md:hidden"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  delete
                </button>
              )}
            </div>
          )}

          {dueOpen && !done && (
            <div className="mt-2" data-no-edit>
              <input
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) =>
                  onUpdate({
                    id: task._id,
                    dueDate: e.target.value || null,
                  })
                }
                className="select-field text-xs"
              />
            </div>
          )}

          {notesOpen && (
            <textarea
              key={`${task._id}-${task.notes ?? ""}`}
              data-no-edit
              defaultValue={task.notes ?? ""}
              onBlur={(e) => {
                const value = e.target.value;
                if (value !== (task.notes ?? "")) {
                  void onUpdate({ id: task._id, notes: value });
                }
              }}
              placeholder="Add a note..."
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          )}

          {subtasks.length > 0 && (
            <div className="mt-2" data-no-edit>
              <SortableTaskList
                projectId={projectId}
                allTasks={allTasks}
                parentTaskId={task._id}
                depth={depth + 1}
              />
            </div>
          )}

          {addingSubtask && !done && (
            <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2" data-no-edit>
              <input
                autoFocus
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Subtask title"
                className="input-field flex-1 py-1.5 text-sm"
              />
              <button type="submit" className="btn-primary px-3 py-1.5 text-sm">
                Add
              </button>
            </form>
          )}
        </div>

        <div
          className={cn(
            "task-delete-actions",
            editingTitle && "task-delete-actions-visible",
          )}
          data-no-edit
        >
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskDragHandle({
  attributes,
  listeners,
}: {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: React.HTMLAttributes<HTMLElement> | undefined;
}) {
  return (
    <button
      type="button"
      data-no-edit
      className="task-drag-handle"
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
