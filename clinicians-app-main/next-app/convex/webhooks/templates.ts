// we need a version of get default for webhooks that doesn't require identity auth

import { v } from "convex/values";
import { query } from "../_generated/server";

// export const getDefault = query({
//   handler: async ({ db, auth }) => {
//     const identity = await auth.getUserIdentity();
//     if (!identity) throw new Error("Not authenticated");

//     const template = await db
//       .query("templates")
//       .withIndex("by_user", (q) => q.eq("userId", identity.subject))
//       .first();

//     if (!template) return null;

//     return template;
//   },
// });

export const getDefault = query({
  args: { userId: v.string(), secret: v.string() },
  handler: async ({ db }, { userId, secret }) => {
    if (secret !== process.env.INTERNAL_WEBHOOK_SECRET)
      throw new Error("Unauthorized");

    const template = await db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!template) return null;

    return template;
  },
});
