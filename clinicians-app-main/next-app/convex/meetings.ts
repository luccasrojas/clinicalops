import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./constants";
import {
  createMeetingSchema,
  updateMeetingSchema,
  zodToConvex,
} from "./zod/zodSchema";
import { nanoid } from "nanoid";
import { MeetingStatus } from "./enums";
import { assertPremiumOrWithinFreeLimit } from "./polar/premium";

export const create = mutation({
  // there is probably an elegant way to get this arg type from zod schema directly
  args: zodToConvex(createMeetingSchema),
  handler: async (ctx, args) => {
    // ✅ Run Zod at runtime
    const parsed = createMeetingSchema.parse(args);
    //     // Throws when the data is invalid
    // const result = myData.parse(untrustedData);
    // // Returns an error object instead
    // const { success, error, data } = myData.safeParse(untrustedData);

    const { name, agentNanoId, simulation } = parsed;

    if (simulation === true)
      await assertPremiumOrWithinFreeLimit(ctx, "simulations");
    else await assertPremiumOrWithinFreeLimit(ctx, "sessions");

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    // get agent real id btw
    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", agentNanoId))
      .first();

    if (!agent) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Paciente asociado no encontrado",
      });
    }

    // TODO: Create stream call, upsert stream users

    const meetingNanoId = nanoid();
    await db.insert("meetings", {
      nanoId: meetingNanoId,
      name,
      userId: identity.subject, // pass in Clerk user ID from frontend auth
      agentId: agent._id,
      agentNanoId,
      status: "upcoming",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      simulation: simulation, // default to true for now
    });

    return {
      nanoId: meetingNanoId,
    };
  },
});

export const update = mutation({
  args: zodToConvex(updateMeetingSchema),
  handler: async (ctx, args) => {
    // ✅ Run Zod at runtime
    const parsed = updateMeetingSchema.parse(args);

    const { nanoId, name, agentNanoId } = parsed;

    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!meeting) {
      throw new Error("Meeting not found");
    }
    if (meeting.userId !== identity.subject) {
      throw new Error("Forbidden");
    }

    // DONT FORGET TO VALIDATE AGENT NANOID EXISTS
    const agent = await db
      .query("agents")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", agentNanoId))
      .first();

    if (!agent) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Paciente asociado no encontrado",
      });
    }

    return await db.patch(meeting._id, {
      name,
      // It'd be a disaster not to update both
      agentId: agent._id,
      agentNanoId,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    nanoId: v.string(),
  },
  handler: async (ctx, { nanoId }) => {
    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!meeting) {
      throw new Error("Meeting not found");
    }
    if (meeting.userId !== identity.subject) {
      throw new Error("Forbidden");
    }

    await db.delete(meeting._id);

    return {
      success: true,
    };
  },
});

export const getOne = query({
  args: { nanoId: v.string() },
  handler: async ({ db, auth }, { nanoId }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!meeting) return null;

    if (meeting.userId !== identity.subject) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You do not have access to this meeting",
      });
    }

    // Hydrate agent
    const agent = await db.get(meeting.agentId);
    if (!agent) {
      throw new ConvexError({
        code: "INTERNAL",
        message: "Associated paciente not found",
      });
    }

    // Compute derived values
    let duration: number | undefined = undefined;
    if (meeting.startedAt && meeting.endedAt) {
      duration = meeting.endedAt - meeting.startedAt;
    }

    // Structured, enriched response
    return {
      ...meeting,
      agent,
      duration,
    };
  },
});

export const getMany = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    search: v.optional(v.string()),
    agentNanoId: v.optional(v.string()),
    status: v.optional(MeetingStatus),
    simulation: v.optional(v.boolean()),
  },
  handler: async (
    { db, auth },
    {
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
      search,
      agentNanoId,
      status,
      simulation,
    }
  ) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let meetings = [];

    const userId = identity.subject;

    // Choose base query (search or index)
    const baseQuery =
      search && search.trim().length > 0
        ? db
            .query("meetings")
            .withSearchIndex("search_name", (q) =>
              q.search("name", search).eq("userId", userId)
            )
        : db
            .query("meetings")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc");

    // Apply optional filters in a chain
    let q = baseQuery;

    if (agentNanoId)
      q = q.filter((m) => m.eq(m.field("agentNanoId"), agentNanoId));
    if (status) q = q.filter((m) => m.eq(m.field("status"), status));
    if (simulation !== undefined)
      q = q.filter((m) => m.eq(m.field("simulation"), simulation));

    // Execute
    meetings = await q.collect();

    // total count before pagination
    const totalCount = meetings.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    // pagination slice
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = meetings.slice(start, end);

    // add computed fields (if needed)
    // const items = paginated.map((meeting) => ({
    //   ...meeting,
    // }));
    // JOIN: hydrate agent for each meeting
    const items = await Promise.all(
      paginated.map(async (meeting) => {
        // const agent = meeting.agentId ? await db.get(meeting.agentId) : null;
        const agent = await db.get(meeting.agentId);

        if (!agent) {
          throw new ConvexError({
            code: "INTERNAL",
            message: "Associated paciente not found",
          });
        }

        // Add duration from startedAt and endedAt
        let duration = undefined;
        if (meeting.startedAt && meeting.endedAt) {
          duration = meeting.endedAt - meeting.startedAt;
        }

        return { ...meeting, agent, duration };
      })
    );

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

export const updateStructuredClinicalNote = mutation({
  args: {
    nanoId: v.string(),
    structuredClinicalNoteJson: v.string(),
  },
  handler: async (ctx, { nanoId, structuredClinicalNoteJson }) => {
    const { db } = ctx;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!meeting) {
      throw new Error("Meeting not found");
    }
    if (meeting.userId !== identity.subject) {
      throw new Error("Forbidden");
    }

    return await db.patch(meeting._id, {
      structuredClinicalNoteJson,
      updatedAt: Date.now(),
    });
  },
});

// // Notas Totales
// 0
// Este Mes
// 12500s
// Duración Prom.

// I want a query that returns the total meetings with clinical notes not undefined for a given user
// and the count for this month too
// and the average duration of those meetings

export const getMeetingsWithClinicalNotesStats = query({
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const allMeetings = await db
      .query("meetings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const meetingsWithNotes = allMeetings.filter(
      (m) => m.structuredClinicalNoteJson !== undefined
    );

    const totalNotes = meetingsWithNotes.length;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = meetingsWithNotes.filter(
      (m) => new Date(m.createdAt) >= thisMonthStart
    ).length;

    const avgDuration =
      meetingsWithNotes.reduce((acc, m) => {
        if (m.startedAt && m.endedAt) {
          return acc + (m.endedAt - m.startedAt);
        }
        return acc;
      }, 0) / (totalNotes || 1);

    return {
      totalNotes,
      thisMonth,
      // this is in what unit? milliseconds
      avgDurationMs: Math.round(avgDuration),
    };
  },
});
