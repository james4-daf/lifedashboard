"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  countCompletedTopLevel,
  countOpenTopLevel,
  filterTodayTasks,
  filterUpcomingTasks,
  topLevelTasks,
} from "@/lib/task-filters";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";

const views = [
  { href: "/projects/today", label: "Today", icon: Sun },
  { href: "/projects/upcoming", label: "Upcoming", icon: CalendarRange },
  { href: "/projects/all", label: "All open", icon: LayoutGrid },
  { href: "/projects/completed", label: "Completed", icon: CheckCircle2 },
] as const;

export default function ProjectsSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const projects = useQuery(api.projects.list, { includeInactive: false });
  const allTasks = useQuery(api.tasks.listAll);
  const createProject = useMutation(api.projects.create);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const activeProjectId =
    pathname.startsWith("/projects/") &&
    !["all", "today", "upcoming", "completed"].includes(pathname.split("/")[2] ?? "")
      ? (pathname.split("/")[2] as Id<"projects">)
      : null;

  const viewCounts = allTasks
    ? {
        today: topLevelTasks(filterTodayTasks(allTasks)).length,
        upcoming: topLevelTasks(filterUpcomingTasks(allTasks)).length,
        allOpen: countOpenTopLevel(allTasks),
        completed: countCompletedTopLevel(allTasks),
      }
    : null;

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const id = await createProject({ name: name.trim() });
    setName("");
    setAdding(false);
    window.location.href = `/projects/${id}`;
  }

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="sidebar-brand">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--surface)]">
          L
        </span>
        <span className="text-sm text-[var(--muted)]">
          Life <span className="text-[var(--foreground)]">/ dashboard</span>
        </span>
      </div>

      <div className="sidebar-search">
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1">Search</span>
        <kbd className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </div>

      <nav className="mt-4 space-y-0.5 px-2">
        {views.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const countKey =
            href === "/projects/today"
              ? "today"
              : href === "/projects/upcoming"
                ? "upcoming"
                : href === "/projects/all"
                  ? "allOpen"
                  : "completed";
          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-nav-item", active && "sidebar-nav-item-active")}
            >
              <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span>{label}</span>
              {viewCounts && (
                <span className="sidebar-nav-count">{viewCounts[countKey]}</span>
              )}
            </Link>
          );
        })}
        <Link
          href="/calendar"
          className={cn(
            "sidebar-nav-item",
            pathname.startsWith("/calendar") && "sidebar-nav-item-active",
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          <span>Calendar</span>
        </Link>
      </nav>

      <div className="mt-6 px-4">
        <p className="section-label">Projects</p>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
        {!projects ? (
          <p className="px-3 py-2 text-sm text-[var(--muted)]">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="px-3 py-2 text-sm text-[var(--muted)]">No projects yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((project) => {
              const active = activeProjectId === project._id;
              const hasOpen = project.openTaskCount > 0;
              return (
                <li key={project._id}>
                  <Link
                    href={`/projects/${project._id}`}
                    className={cn("sidebar-nav-item", active && "sidebar-nav-item-active")}
                  >
                    <span
                      className={cn(
                        hasOpen ? "sidebar-project-icon" : "sidebar-project-icon-outline",
                      )}
                      style={
                        hasOpen ? { backgroundColor: project.color } : undefined
                      }
                    />
                    <span className="truncate">{project.name}</span>
                    <span className="sidebar-nav-count">{project.openTaskCount || ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {adding ? (
          <form onSubmit={handleCreate} className="mt-3 space-y-2 px-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="input-field py-2 text-sm"
            />
            <button type="submit" className="btn-primary w-full py-2 text-sm">
              Create
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="sidebar-nav-item mt-2 w-full text-[var(--muted)]"
          >
            <Plus className="h-4 w-4" />
            <span>New project</span>
          </button>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="sidebar-nav-item w-full text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
