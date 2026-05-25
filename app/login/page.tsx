"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("flow", mode);

    try {
      await signIn("password", formData);
      router.push("/projects/all");
      router.refresh();
    } catch {
      setError(
        mode === "signIn"
          ? "Could not sign in. Check your email and password."
          : "Could not create account. Password must be at least 8 characters.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            Life Dashboard
          </p>
          <h1 className="mt-3 font-display text-4xl text-[var(--foreground)]">
            {mode === "signIn" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            One calm place for your projects and tasks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              minLength={8}
              className="input-field"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {mode === "signIn" ? "First time here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            {mode === "signIn" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
