"use client";

import TaskBoardShell from "@/components/task-board-shell";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { countCompletedTopLevel, countOpenTopLevel } from "@/lib/task-filters";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export default function AllProjectsPanel() {
  const tasks = useQuery(api.tasks.listAll);
  const projects = useQuery(api.projects.list, { includeInactive: false });
  const createTask = useMutation(api.tasks.create);
  const [projectId, setProjectId] = useState<Id<"projects"> | "">("");

  const selectedProject = projectId || projects?.[0]?._id || "";
  const openCount = tasks ? countOpenTopLevel(tasks) : 0;
  const doneCount = tasks ? countCompletedTopLevel(tasks) : 0;

  return (
    <TaskBoardShell
      breadcrumb="Projects / All"
      title="All projects"
      doneCount={doneCount}
      totalCount={openCount + doneCount}
      addPlaceholder="Add a task..."
      addExtra={
        projects && projects.length > 0 ? (
          <select
            value={selectedProject}
            onChange={(e) => setProjectId(e.target.value as Id<"projects">)}
            className="select-field w-auto shrink-0 py-1 text-xs"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : undefined
      }
      onAddTask={async (title) => {
        if (!selectedProject) return;
        await createTask({ projectId: selectedProject as Id<"projects">, title });
      }}
      combinedTasks={tasks}
      showProjectLabel
      emptyMessage="Create a project in the sidebar to start adding tasks."
    />
  );
}
