"use client";

import ProjectsSidebar from "@/components/projects-sidebar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectsIndexPage() {
  const projects = useQuery(api.projects.list, { includeInactive: false });
  const router = useRouter();

  useEffect(() => {
    if (projects && projects.length > 0) {
      router.replace("/projects/all");
    }
  }, [projects, router]);

  if (!projects) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--muted)]">
        Loading projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col md:flex-row">
        <div className="md:hidden">
          <ProjectsSidebar />
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <h1 className="font-display text-3xl text-[var(--foreground)]">No projects yet</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Create a project in the sidebar to start adding tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--muted)]">
      Opening project...
    </div>
  );
}
