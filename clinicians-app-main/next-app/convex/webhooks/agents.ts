// getOne

import { v } from "convex/values";
import { query } from "../_generated/server";

// get one for webhook
export const getOne = query({
  args: { nanoId: v.string(), secret: v.string() },
  handler: async ({ db }, { nanoId, secret }) => {
    if (secret !== process.env.INTERNAL_WEBHOOK_SECRET)
      throw new Error("Unauthorized");

    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    return agent ?? null;
  },
});

// get many agents by nanoIds (webhook version)
export const getManyByIds = query({
  args: {
    nanoIds: v.array(v.string()), // array of nanoIds
    secret: v.string(),
  },
  handler: async ({ db }, { nanoIds, secret }) => {
    console.log("getManyByIds called with nanoIds:", nanoIds);
    // simple secret check (no identity)
    if (secret !== process.env.INTERNAL_WEBHOOK_SECRET)
      throw new Error("Unauthorized");

    // fetch all agents that match the given nanoIds
    // there's probably a better way to do this than reading the db every time
    // but indexation is hashing anyways?
    const results = await Promise.all(
      nanoIds.map(async (nanoId) => {
        const agent = await db
          .query("agents")
          .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
          .first();
        return agent ?? null;
      })
    );

    console.log("Fetched agents:", results);

    // return all valid agents (filtering out nulls)
    // return results.filter(Boolean);

    const _results = results.filter(
      (agent): agent is NonNullable<typeof agent> => {
        return !!agent;
      }
    );

    console.log("Filtered valid agents:", _results);

    return _results;
  },
});
