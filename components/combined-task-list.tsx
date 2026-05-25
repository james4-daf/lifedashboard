"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { TaskItemCore } from "@/components/task-item-core";
import type { TaskWithProject } from "@/lib/task-filters";
import { useMutation } from "convex/react";
import { useMemo } from "react";

type CombinedTaskListProps = {
  tasks: TaskWithProject[];
  showProjectLabel?: boolean;
};

export default function CombinedTaskList({
  tasks,
  showProjectLabel = false,
}: CombinedTaskListProps) {
  const updateTask = useMutation(api.tasks.update);
  const createTask = useMutation(api.tasks.create);
  const removeTask = useMutation(api.tasks.remove);

  const tasksByProject = useMemo(() => {
    const map = new Map<Id<"projects">, Doc<"tasks">[]>();
    for (const task of tasks) {
      const list = map.get(task.projectId) ?? [];
      list.push(task);
      map.set(task.projectId, list);
    }
    return map;
  }, [tasks]);

  const topLevelTasks = useMemo(
    () => tasks.filter((t) => !t.parentTaskId),
    [tasks],
  );

  return (
    <div className="space-y-2">
      {topLevelTasks.map((task) => (
        <TaskItemCore
          key={task._id}
          task={task}
          allTasks={tasksByProject.get(task.projectId) ?? []}
          projectId={task.projectId}
          showProjectLabel={
            showProjectLabel && task.projectName
              ? { name: task.projectName, color: task.projectColor ?? "var(--accent)" }
              : undefined
          }
          onUpdate={async (args) => {
            await updateTask(args);
          }}
          onDelete={async (id) => {
            await removeTask({ id });
          }}
          onCreate={async ({ title, parentTaskId: parentId }) => {
            await createTask({
              projectId: task.projectId,
              title,
              parentTaskId: parentId,
            });
          }}
        />
      ))}
    </div>
  );
}
