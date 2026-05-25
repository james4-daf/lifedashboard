import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const projectStatus = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("done"),
  v.literal("archived"),
);

export const taskStatus = v.union(
  v.literal("todo"),
  v.literal("doing"),
  v.literal("done"),
);

export default defineSchema({
  ...authTables,
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    status: projectStatus,
    sortOrder: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  tasks: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    parentTaskId: v.optional(v.id("tasks")),
    title: v.string(),
    notes: v.optional(v.string()),
    status: taskStatus,
    priority: v.number(),
    dueDate: v.optional(v.string()),
    sortOrder: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentTaskId"])
    .index("by_user", ["userId"])
    .index("by_user_due_date", ["userId", "dueDate"]),
});
