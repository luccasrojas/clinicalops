// convex/profiles.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user's profile by user_id
 */
export const getByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique(); // profiles should be 1:1 with users
  },
});

/**
 * Create or update a user's profile (upsert)
 */
export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    specialty: v.optional(v.string()),
    medicalLicense: v.optional(v.string()),
    institution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      // Update
      await ctx.db.patch(existing._id, {
        first_name: args.firstName ?? existing.first_name,
        last_name: args.lastName ?? existing.last_name,
        specialty: args.specialty ?? existing.specialty,
        medical_license: args.medicalLicense ?? existing.medical_license,
        institution: args.institution ?? existing.institution,
        updated_at: now,
      });
      return { status: "updated" };
    } else {
      // Insert
      await ctx.db.insert("profiles", {
        user_id: args.userId,
        first_name: args.firstName ?? undefined,
        last_name: args.lastName ?? undefined,
        specialty: args.specialty ?? undefined,
        medical_license: args.medicalLicense ?? undefined,
        institution: args.institution ?? undefined,
        created_at: now,
        updated_at: now,
        id: crypto.randomUUID(),
      });
      return { status: "created" };
    }
  },
});
