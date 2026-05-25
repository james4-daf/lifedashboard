"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CalendarMonth() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const startDate = format(gridStart, "yyyy-MM-dd");
  const endDate = format(gridEnd, "yyyy-MM-dd");

  const tasks = useQuery(api.tasks.listByDateRange, { startDate, endDate });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof tasks>>();
    for (const task of tasks ?? []) {
      if (!task.dueDate) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    return map;
  }, [tasks]);

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-[var(--foreground)]">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              className="icon-btn"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="icon-btn"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(key) ?? [];
            const selected = key === selectedDate;
            const today = isSameDay(day, new Date());

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "calendar-day",
                  !isSameMonth(day, currentMonth) && "calendar-day-outside",
                  selected && "calendar-day-selected",
                  today && "calendar-day-today",
                )}
              >
                <span>{format(day, "d")}</span>
                {dayTasks.length > 0 && (
                  <span className="calendar-dot" style={{ backgroundColor: dayTasks[0]?.projectColor }} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="card h-fit">
        <h3 className="font-display text-xl text-[var(--foreground)]">
          {format(parseISO(selectedDate), "EEEE, MMM d")}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {selectedTasks.length === 0
            ? "Nothing due this day"
            : `${selectedTasks.length} ${selectedTasks.length === 1 ? "task" : "tasks"} due`}
        </p>

        <div className="mt-5 space-y-3">
          {selectedTasks.map((task) => (
            <Link
              key={task._id}
              href={`/projects/${task.projectId}`}
              className="block rounded-2xl bg-[var(--surface-muted)] px-4 py-3 transition hover:bg-[var(--accent-soft)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: task.projectColor }}
                />
                <span className="text-xs text-[var(--muted)]">{task.projectName}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--foreground)]">{task.title}</p>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
