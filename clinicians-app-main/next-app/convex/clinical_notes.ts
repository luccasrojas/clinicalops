// convex/clinical_notes.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all clinical notes for a given user_id
 */
export const getByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("clinical_notes")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc") // newest first
      .collect();
  },
});
