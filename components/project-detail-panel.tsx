"use client";

import TaskBoardShell from "@/components/task-board-shell";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { topLevelTasks } from "@/lib/task-filters";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";

export default function ProjectDetailPanel({ projectId }: { projectId: Id<"projects"> }) {
  const project = useQuery(api.projects.get, { id: projectId });
  const tasks = useQuery(api.tasks.listByProject, { projectId });
  const updateProject = useMutation(api.projects.update);
  const createTask = useMutation(api.tasks.create);
  const removeProject = useMutation(api.projects.remove);

  if (project === undefined || tasks === undefined) {
    return (
      <TaskBoardShell
        breadcrumb="Projects"
        title="Loading..."
        addPlaceholder="Add a task..."
        onAddTask={async () => {}}
        tasks={null}
        projectId={projectId}
        emptyMessage=""
      />
    );
  }

  if (project === null) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-[var(--muted)]">Project not found.</p>
          <Link href="/projects/all" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Back to all projects
          </Link>
        </div>
      </div>
    );
  }

  const topLevel = topLevelTasks(tasks);
  const doneCount = topLevel.filter((t) => t.status === "done").length;

  return (
    <TaskBoardShell
      breadcrumb={`Projects / ${project.name}`}
      title={project.name}
      titleEditable
      onTitleSave={async (value) => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === project.name) return;
        await updateProject({ id: project._id, name: trimmed });
      }}
      doneCount={doneCount}
      totalCount={topLevel.length}
      addPlaceholder={`Add a task to ${project.name}...`}
      onAddTask={async (title) => {
        await createTask({ projectId, title });
      }}
      tasks={tasks}
      projectId={projectId}
      emptyMessage="No tasks yet. Add one above."
      onDeleteProject={() => {
        if (confirm(`Delete "${project.name}" and all its tasks?`)) {
          void removeProject({ id: project._id }).then(() => {
            window.location.href = "/projects/all";
          });
        }
      }}
    />
  );
}
