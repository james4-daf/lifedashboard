"use client";

import { cn } from "@/lib/utils";
import type { TaskFilter } from "@/lib/task-filters";

export default function TaskFilterTabs({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
}) {
  const tabs: { id: TaskFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "done", label: "Done" },
  ];

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn("filter-tab", value === tab.id && "filter-tab-active")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
