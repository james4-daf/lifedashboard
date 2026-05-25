"use client";

import ProjectsSidebar from "@/components/projects-sidebar";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="hidden w-64 shrink-0 md:block">
        <ProjectsSidebar />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
