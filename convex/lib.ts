import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string | undefined) {
  if (!dueDate) return false;
  return dueDate < todayIsoDate();
}
