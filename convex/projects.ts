import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isOverdue, requireUserId } from "./lib";
import { projectStatus } from "./schema";

const PROJECT_COLORS = [
  "#5B7553",
  "#7A6B5D",
  "#4A6670",
  "#8B6914",
  "#6B5B7A",
  "#3D6B5E",
];

function isDeleted(item: { deletedAt?: number }) {
  return item.deletedAt !== undefined;
}

function sortProjects<T extends { sortOrder: number; updatedAt: number; hasOverdue: boolean }>(
  projects: T[],
) {
  return [...projects].sort((a, b) => {
    if (a.hasOverdue !== b.hasOverdue) return a.hasOverdue ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.updatedAt - b.updatedAt;
  });
}

export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const includeInactive = args.includeInactive ?? false;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const visible = projects.filter((p) => {
      if (isDeleted(p)) return false;
      return includeInactive
        ? true
        : p.status === "active" || p.status === "paused";
    });

    const enriched = await Promise.all(
      visible.map(async (project) => {
        const tasks = (
          await ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect()
        ).filter((task) => !isDeleted(task));

        const openTasks = tasks.filter((t) => t.status !== "done" && !t.parentTaskId);
        const hasOverdue = openTasks.some((t) => isOverdue(t.dueDate));

        const nextTask = [...openTasks]
          .sort((a, b) => {
            if (a.status === "doing" && b.status !== "doing") return -1;
            if (b.status === "doing" && a.status !== "doing") return 1;
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.sortOrder - b.sortOrder;
          })[0];

        return {
          ...project,
          openTaskCount: openTasks.length,
          hasOverdue,
          nextTask: nextTask
            ? {
                _id: nextTask._id,
                title: nextTask.title,
                status: nextTask.status,
                priority: nextTask.priority,
                dueDate: nextTask.dueDate,
              }
            : null,
        };
      }),
    );

    return sortProjects(enriched);
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId || isDeleted(project)) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = (
      await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((project) => !isDeleted(project));

    const color =
      args.color ??
      PROJECT_COLORS[existing.length % PROJECT_COLORS.length] ??
      PROJECT_COLORS[0];

    const now = Date.now();
    return await ctx.db.insert("projects", {
      userId,
      name: args.name.trim(),
      color,
      status: "active",
      sortOrder: existing.length,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(projectStatus),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId || isDeleted(project)) {
      throw new Error("Project not found");
    }

    const { id, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.color !== undefined) patch.color = updates.color;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.sortOrder !== undefined) patch.sortOrder = updates.sortOrder;

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId || isDeleted(project)) {
      throw new Error("Project not found");
    }

    const deletedAt = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const task of tasks) {
      if (!isDeleted(task)) {
        await ctx.db.patch(task._id, { deletedAt, updatedAt: deletedAt });
      }
    }

    await ctx.db.patch(args.id, { deletedAt, updatedAt: deletedAt });
  },
});

export const restore = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId || !isDeleted(project)) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const task of tasks) {
      if (isDeleted(task)) {
        await ctx.db.patch(task._id, { deletedAt: undefined, updatedAt: now });
      }
    }

    await ctx.db.patch(args.id, { deletedAt: undefined, updatedAt: now });
  },
});
