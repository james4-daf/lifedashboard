import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib";
import { taskStatus } from "./schema";

function isDeleted<T extends { deletedAt?: number }>(item: T) {
  return item.deletedAt !== undefined;
}

async function softDeleteTaskTree(
  ctx: MutationCtx,
  taskId: Id<"tasks">,
  deletedAt: number,
) {
  const subtasks = await ctx.db
    .query("tasks")
    .withIndex("by_parent", (q) => q.eq("parentTaskId", taskId))
    .collect();

  for (const subtask of subtasks) {
    if (!isDeleted(subtask)) {
      await softDeleteTaskTree(ctx, subtask._id, deletedAt);
    }
  }

  await ctx.db.patch(taskId, { deletedAt, updatedAt: deletedAt });
}

async function restoreTaskTree(ctx: MutationCtx, taskId: Id<"tasks">) {
  const task = await ctx.db.get(taskId);
  if (!task || !isDeleted(task)) return;

  const subtasks = await ctx.db
    .query("tasks")
    .withIndex("by_parent", (q) => q.eq("parentTaskId", taskId))
    .collect();

  for (const subtask of subtasks) {
    if (isDeleted(subtask)) {
      await restoreTaskTree(ctx, subtask._id);
    }
  }

  const now = Date.now();
  await ctx.db.patch(taskId, { deletedAt: undefined, updatedAt: now });
}

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId || isDeleted(project)) return [];

    return (
      await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect()
    ).filter((task) => !isDeleted(task));
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
      (p) =>
        !isDeleted(p) && (p.status === "active" || p.status === "paused"),
    );
    const projectMap = new Map(activeProjects.map((p) => [p._id, p]));
    const activeProjectIds = new Set(activeProjects.map((p) => p._id));

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enriched = tasks
      .filter((task) => !isDeleted(task) && activeProjectIds.has(task.projectId))
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

export const listDeleted = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const [tasks, projects] = await Promise.all([
      ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const projectMap = new Map(projects.map((p) => [p._id, p]));

    const deletedTasks = tasks
      .filter((task) => {
        if (!isDeleted(task) || task.parentTaskId) return false;
        const project = projectMap.get(task.projectId);
        return project !== undefined && !isDeleted(project);
      })
      .map((task) => {
        const project = projectMap.get(task.projectId)!;
        return {
          ...task,
          kind: "task" as const,
          projectName: project.name,
          projectColor: project.color,
          projectDeleted: false,
        };
      });

    const deletedProjects = projects
      .filter((project) => isDeleted(project))
      .map((project) => ({
        kind: "project" as const,
        _id: project._id,
        name: project.name,
        color: project.color,
        deletedAt: project.deletedAt!,
        taskCount: tasks.filter(
          (task) => task.projectId === project._id && isDeleted(task),
        ).length,
      }));

    return [...deletedProjects, ...deletedTasks].sort(
      (a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0),
    );
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
        !isDeleted(task) &&
        task.dueDate &&
        task.dueDate >= args.startDate &&
        task.dueDate <= args.endDate &&
        task.status !== "done",
    );

    return await Promise.all(
      inRange.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        if (!project || isDeleted(project)) return null;
        return {
          ...task,
          projectName: project?.name ?? "Unknown",
          projectColor: project?.color ?? "#5B7553",
        };
      }),
    ).then((items) => items.filter((item) => item !== null));
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
    if (!project || project.userId !== userId || isDeleted(project)) {
      throw new Error("Project not found");
    }

    if (args.parentTaskId) {
      const parent = await ctx.db.get(args.parentTaskId);
      if (
        !parent ||
        parent.userId !== userId ||
        parent.projectId !== args.projectId ||
        isDeleted(parent)
      ) {
        throw new Error("Parent task not found");
      }
    }

    const siblings = (
      await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect()
    ).filter(
      (t) =>
        !isDeleted(t) &&
        (args.parentTaskId ? t.parentTaskId === args.parentTaskId : !t.parentTaskId),
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
    if (!task || task.userId !== userId || isDeleted(task)) {
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

      const subtasks = (
        await ctx.db
          .query("tasks")
          .withIndex("by_parent", (q) => q.eq("parentTaskId", args.id))
          .collect()
      ).filter((subtask) => !isDeleted(subtask));

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
    if (!project || project.userId !== userId || isDeleted(project)) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    for (let i = 0; i < args.orderedIds.length; i++) {
      const task = await ctx.db.get(args.orderedIds[i]);
      if (
        !task ||
        task.userId !== userId ||
        task.projectId !== args.projectId ||
        isDeleted(task)
      ) {
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
    if (!task || task.userId !== userId || isDeleted(task)) {
      throw new Error("Task not found");
    }

    const deletedAt = Date.now();
    const projectId = task.projectId;
    await softDeleteTaskTree(ctx, args.id, deletedAt);
    await ctx.db.patch(projectId, { updatedAt: deletedAt });
  },
});

export const restore = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId || !isDeleted(task)) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    if (isDeleted(project)) {
      throw new Error("Restore the project first");
    }

    await restoreTaskTree(ctx, args.id);
    await ctx.db.patch(task.projectId, { updatedAt: Date.now() });
  },
});
