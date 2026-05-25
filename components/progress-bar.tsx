"use client";

export default function ProgressBar({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--muted)]">
        {done}/{total} done
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--muted)]">{percent}%</span>
    </div>
  );
}
