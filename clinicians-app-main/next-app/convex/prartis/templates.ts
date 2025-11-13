import { nanoid } from "nanoid";
import { mutation, query } from "../_generated/server";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "../zod/templatesSchema";
import { zodToConvex } from "../zod/zodSchema";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: zodToConvex(createTemplateSchema),
  handler: async (ctx, args) => {
    const parsed = createTemplateSchema.parse(args);

    const { name, clinicalNoteExampleContent } = parsed;

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    const templateNanoId = nanoid();
    const templateId = await db.insert("templates", {
      nanoId: templateNanoId,
      name,
      clinicalNoteExampleContent,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return templateId;
  },
});

export const update = mutation({
  args: zodToConvex(updateTemplateSchema),
  handler: async (ctx, args) => {
    const parsed = updateTemplateSchema.parse(args);

    const { nanoId, name, clinicalNoteExampleContent } = parsed;

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const template = await db
      .query("templates")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!template) {
      throw new Error("Template not found");
    }
    if (template.userId !== identity.subject) {
      throw new Error("Forbidden");
    }

    return await db.patch(template._id, {
      name,
      clinicalNoteExampleContent,
      updatedAt: Date.now(),
    });
  },
});

export const getOne = query({
  args: { nanoId: v.string() },
  handler: async ({ db, auth }, { nanoId }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const template = await db
      .query("templates")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!template) return null;

    if (template.userId !== identity.subject) {
      throw new ConvexError({
        message: "Forbidden",
        code: "unauthorized",
      });
    }

    return template;
  },
});

// We'll have a get default one that simply takes the first one of a given user
export const getDefault = query({
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const template = await db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!template) return null;

    return template;
  },
});
