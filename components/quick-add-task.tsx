"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

export default function QuickAddTask({ projectId }: { projectId: Id<"projects"> }) {
  const createTask = useMutation(api.tasks.create);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ projectId, title: title.trim() });
      setTitle("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
      >
        <Plus className="h-4 w-4" />
        Quick add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="input-field flex-1 py-2 text-sm"
      />
      <button type="submit" disabled={loading || !title.trim()} className="btn-primary px-4 py-2 text-sm">
        Add
      </button>
    </form>
  );
}
