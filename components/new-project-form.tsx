"use client";

import { api } from "@/convex/_generated/api";
import { PROJECT_COLORS } from "@/lib/types";
import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";

export default function NewProjectForm({ onCreated }: { onCreated?: () => void }) {
  const createProject = useMutation(api.projects.create);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createProject({ name: name.trim(), color });
      setName("");
      onCreated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <h2 className="font-display text-xl text-[var(--foreground)]">New project</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Keep each area of life in its own lane.</p>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="input-field"
      />
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="h-8 w-8 rounded-full border-2 transition"
            style={{
              backgroundColor: c,
              borderColor: color === c ? "var(--foreground)" : "transparent",
            }}
            aria-label="Choose project color"
          />
        ))}
      </div>
      <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
        Create project
      </button>
    </form>
  );
}
