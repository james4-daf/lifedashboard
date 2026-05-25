"use client";

import TaskBoardShell from "@/components/task-board-shell";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  countCompletedTopLevel,
  countOpenTopLevel,
  filterCompletedTasks,
  filterTodayTasks,
  filterUpcomingTasks,
  type TaskWithProject,
} from "@/lib/task-filters";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

type SmartView = "today" | "upcoming" | "completed";

const config: Record<
  SmartView,
  {
    breadcrumb: string;
    title: string;
    placeholder: string;
    empty: string;
    filter: (t: TaskWithProject[]) => TaskWithProject[];
  }
> = {
  today: {
    breadcrumb: "Today",
    title: "Today",
    placeholder: "Add a task for today...",
    empty: "Nothing due today. Enjoy the calm.",
    filter: filterTodayTasks,
  },
  upcoming: {
    breadcrumb: "Upcoming",
    title: "Upcoming",
    placeholder: "Add an upcoming task...",
    empty: "Nothing scheduled for the next two weeks.",
    filter: filterUpcomingTasks,
  },
  completed: {
    breadcrumb: "Completed",
    title: "Completed",
    placeholder: "Add a task...",
    empty: "No completed tasks yet.",
    filter: filterCompletedTasks,
  },
};

export default function SmartViewPanel({ view }: { view: SmartView }) {
  const allTasks = useQuery(api.tasks.listAll);
  const projects = useQuery(api.projects.list, { includeInactive: false });
  const createTask = useMutation(api.tasks.create);
  const [projectId, setProjectId] = useState<Id<"projects"> | "">("");
  const cfg = config[view];

  const selectedProject = projectId || projects?.[0]?._id || "";
  const filtered = allTasks ? cfg.filter(allTasks) : undefined;
  const openCount = allTasks ? countOpenTopLevel(allTasks) : 0;
  const doneCount = allTasks ? countCompletedTopLevel(allTasks) : 0;

  return (
    <TaskBoardShell
      breadcrumb={cfg.breadcrumb}
      title={cfg.title}
      doneCount={view === "completed" ? doneCount : undefined}
      totalCount={view === "completed" ? doneCount : openCount}
      addPlaceholder={cfg.placeholder}
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
      combinedTasks={filtered}
      showProjectLabel
      emptyMessage={cfg.empty}
    />
  );
}
