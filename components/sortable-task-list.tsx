"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import TaskItem from "@/components/task-item";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { useMemo } from "react";

function sortByOrder(tasks: Doc<"tasks">[]) {
  return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
}

type SortableTaskListProps = {
  projectId: Id<"projects">;
  allTasks: Doc<"tasks">[];
  parentTaskId?: Id<"tasks">;
  depth?: number;
  statusFilter?: "open" | "done" | "all";
};

export default function SortableTaskList({
  projectId,
  allTasks,
  parentTaskId,
  depth = 0,
  statusFilter = "all",
}: SortableTaskListProps) {
  const updateTask = useMutation(api.tasks.update);
  const createTask = useMutation(api.tasks.create);
  const removeTask = useMutation(api.tasks.remove);
  const reorderTasks = useMutation(api.tasks.reorder);

  const visibleTasks = useMemo(() => {
    let filtered = parentTaskId
      ? allTasks.filter((t) => t.parentTaskId === parentTaskId)
      : allTasks.filter((t) => !t.parentTaskId);
    if (statusFilter === "open") filtered = filtered.filter((t) => t.status !== "done");
    if (statusFilter === "done") filtered = filtered.filter((t) => t.status === "done");
    return sortByOrder(filtered);
  }, [allTasks, parentTaskId, statusFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleTasks.findIndex((t) => t._id === active.id);
    const newIndex = visibleTasks.findIndex((t) => t._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(visibleTasks, oldIndex, newIndex);
    await reorderTasks({
      projectId,
      parentTaskId,
      orderedIds: reordered.map((t) => t._id),
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibleTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              allTasks={allTasks}
              projectId={projectId}
              depth={depth}
              onUpdate={async (args) => {
                await updateTask(args);
              }}
              onDelete={async (id) => {
                await removeTask({ id });
              }}
              onCreate={async ({ title, parentTaskId: parentId }) => {
                await createTask({ projectId, title, parentTaskId: parentId });
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
