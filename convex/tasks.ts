import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib";
import { taskStatus } from "./schema";

async function deleteTaskTree(ctx: MutationCtx, taskId: Id<"tasks">) {
  const subtasks = await ctx.db
    .query("tasks")
    .withIndex("by_parent", (q) => q.eq("parentTaskId", taskId))
    .collect();

  for (const subtask of subtasks) {
    await deleteTaskTree(ctx, subtask._id);
  }

  await ctx.db.delete(taskId);
}

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const listAll = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeProjects = projects.filter(
      (p) => p.status === "active" || p.status === "paused",
    );
    const projectMap = new Map(activeProjects.map((p) => [p._id, p]));
    const activeProjectIds = new Set(activeProjects.map((p) => p._id));

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enriched = tasks
      .filter((task) => activeProjectIds.has(task.projectId))
      .map((task) => {
        const project = projectMap.get(task.projectId);
        return {
          ...task,
          projectName: project?.name ?? "Unknown",
          projectColor: project?.color ?? "#5B7553",
          projectSortOrder: project?.sortOrder ?? 0,
        };
      });

    return enriched.sort((a, b) => {
      if (a.projectSortOrder !== b.projectSortOrder) {
        return a.projectSortOrder - b.projectSortOrder;
      }
      if (a.projectId !== b.projectId) {
        return a.projectName.localeCompare(b.projectName);
      }
      if (a.parentTaskId && !b.parentTaskId) return 1;
      if (!a.parentTaskId && b.parentTaskId) return -1;
      return a.sortOrder - b.sortOrder;
    });
  },
});

export const listByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const inRange = tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate >= args.startDate &&
        task.dueDate <= args.endDate &&
        task.status !== "done",
    );

    return await Promise.all(
      inRange.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        return {
          ...task,
          projectName: project?.name ?? "Unknown",
          projectColor: project?.color ?? "#5B7553",
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    parentTaskId: v.optional(v.id("tasks")),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    if (args.parentTaskId) {
      const parent = await ctx.db.get(args.parentTaskId);
      if (!parent || parent.userId !== userId || parent.projectId !== args.projectId) {
        throw new Error("Parent task not found");
      }
    }

    const siblings = (await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()).filter((t) =>
      args.parentTaskId ? t.parentTaskId === args.parentTaskId : !t.parentTaskId,
    );

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId,
      projectId: args.projectId,
      parentTaskId: args.parentTaskId,
      title: args.title.trim(),
      status: "todo",
      priority: args.priority ?? 2,
      dueDate: args.dueDate,
      sortOrder: siblings.length,
      updatedAt: now,
    });

    await ctx.db.patch(args.projectId, { updatedAt: now });
    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(taskStatus),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.union(v.string(), v.null())),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found");
    }

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
    if (args.dueDate !== undefined) {
      patch.dueDate = args.dueDate === null ? undefined : args.dueDate;
    }

    if (args.status !== undefined) {
      patch.status = args.status;
      patch.completedAt = args.status === "done" ? now : undefined;

      const subtasks = await ctx.db
        .query("tasks")
        .withIndex("by_parent", (q) => q.eq("parentTaskId", args.id))
        .collect();

      for (const subtask of subtasks) {
        await ctx.db.patch(subtask._id, {
          status: args.status,
          completedAt: args.status === "done" ? now : undefined,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.id, patch);
    await ctx.db.patch(task.projectId, { updatedAt: now });
  },
});

export const reorder = mutation({
  args: {
    projectId: v.id("projects"),
    parentTaskId: v.optional(v.id("tasks")),
    orderedIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    for (let i = 0; i < args.orderedIds.length; i++) {
      const task = await ctx.db.get(args.orderedIds[i]);
      if (!task || task.userId !== userId || task.projectId !== args.projectId) {
        throw new Error("Task not found");
      }
      const expectedParent = args.parentTaskId ?? undefined;
      if (task.parentTaskId !== expectedParent) {
        throw new Error("Task parent mismatch");
      }
      await ctx.db.patch(task._id, { sortOrder: i, updatedAt: now });
    }

    await ctx.db.patch(args.projectId, { updatedAt: now });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found");
    }

    const projectId = task.projectId;
    await deleteTaskTree(ctx, args.id);
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
  },
});
