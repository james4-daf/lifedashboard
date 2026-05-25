"use client";

import ProjectDetailPanel from "@/components/project-detail-panel";
import type { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  return <ProjectDetailPanel projectId={projectId} />;
}
