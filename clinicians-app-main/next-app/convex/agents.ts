// convex/agents.ts
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  createAgentSchema,
  updateAgentSchema,
  zodToConvex,
} from "./zod/zodSchema";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./constants";
import { assertPremiumOrWithinFreeLimit } from "./polar/premium";
// https://stack.convex.dev/typescript-zod-function-validation
// https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/server/zod.ts

export const create = mutation({
  // there is probably an elegant way to get this arg type from zod schema directly
  args: zodToConvex(createAgentSchema),
  handler: async (ctx, args) => {
    // ✅ Run Zod at runtime
    const parsed = createAgentSchema.parse(args);
    //     // Throws when the data is invalid
    // const result = myData.parse(untrustedData);
    // // Returns an error object instead
    // const { success, error, data } = myData.safeParse(untrustedData);

    const { name, instructions, artificial } = parsed;

    if (artificial === true)
      await assertPremiumOrWithinFreeLimit(ctx, "agents");

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const agentNanoId = nanoid();

    await db.insert("agents", {
      nanoId: agentNanoId,
      name,
      userId: identity.subject, // pass in Clerk user ID from frontend auth
      instructions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      artificial: artificial, // default to true for now
    });

    return {
      nanoId: agentNanoId,
    };
  },
});

export const update = mutation({
  args: zodToConvex(updateAgentSchema),
  handler: async (ctx, args) => {
    // ✅ Run Zod at runtime
    const parsed = updateAgentSchema.parse(args);

    const { nanoId, name, instructions } = parsed;

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!agent) {
      throw new Error("Agent not found");
    }
    if (agent.userId !== identity.subject) {
      throw new Error("Forbidden");
    }

    return await db.patch(agent._id, {
      name,
      instructions,
      updatedAt: Date.now(),
    });
  },
});

// list all agents (no filtering)
export const getMany = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (
    { db, auth },
    { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, search }
  ) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    let agents = [];

    if (search && search.trim().length > 0) {
      console.log("Querying by search index", search);
      agents = await db
        .query("agents")
        .withSearchIndex("search_name", (q) =>
          q.search("name", search).eq("userId", userId)
        )
        .collect();
    } else {
      console.log("Querying by user index");
      agents = await db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    // total count before pagination
    const totalCount = agents.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    // pagination slice
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = agents.slice(start, end);

    // add computed fields (if needed)
    const items = paginated.map((agent) => ({
      ...agent,
      meetingCount: 6, // placeholder
    }));

    // structured response
    return {
      items,
      total: totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  },
});

// convex/agents.ts
export const getByUser = query({
  args: { userId: v.string() }, // Clerk user id
  handler: async ({ db }, { userId }) => {
    return await db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// get one

// export const getOne = query({
//   args: { nanoId: v.string() },
//   handler: async ({ db }, { nanoId }) => {
//     return await db
//       .query("agents")
//       .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
//       .first();

//   },
// });
export const getOne = query({
  args: { nanoId: v.string() },
  handler: async ({ db, auth }, { nanoId }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      // dont know why this doesnt work
      // .filter((q) => q.eq("userId", identity.subject)) // ensure user owns the agent
      .first();

    if (!agent) {
      // throw new ConvexError({
      //   code: "NOT_FOUND",
      //   message: "Agent not found",
      // });
      return null;
    }

    // console.log("auth identity", identity);
    // console.log("agent filtered", agent);

    // compare user ids manually
    if (agent.userId !== identity.subject) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have access to this agent",
      });
    }

    // Add computed field
    // https://chatgpt.com/c/68e247f2-ab78-8320-90f4-1d34bb575396
    const meetingCount = 6; // could also be result of another query
    return { ...agent, meetingCount };
  },
});

// export const getById = query({
//   args: { nanoId: v.string() },
//   handler: async ({ db }, { nanoId }) => {
//     return await db.get(nanoId);
//   },
// });

// // update one
// export const updateAgent = mutation({
//   args: {
//     id: v.id("agents"),
//     name: v.string(),
//     instructions: v.string(),
//   },
//   handler: async (ctx, { id, name, instructions }) => {
//     const { db } = ctx;
//     const identity = await ctx.auth.getUserIdentity();

//     if (!identity) {
//       throw new Error("Unauthorized");
//     }

//     const agent = await db.get(id);
//     if (!agent) {
//       throw new Error("Agent not found");
//     }
//     if (agent.userId !== identity.subject) {
//       throw new Error("Forbidden");
//     }

//     return await db.update(id, {
//       name,
//       instructions,
//       updatedAt: Date.now(),
//     });
//   },
// });

export const remove = mutation({
  args: { nanoId: v.string() },
  handler: async (ctx, { nanoId }) => {
    const { db, auth } = ctx;
    const identity = await auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!agent) {
      // throw new Error("Agent not found");
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Agent not found",
      });
    }
    if (agent.userId !== identity.subject) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have access to this agent",
      });
    }

    await db.delete(agent._id);
    // return removed agent
    return agent;
  },
});
