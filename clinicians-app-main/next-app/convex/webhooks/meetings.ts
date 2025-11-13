import { ConvexError, v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { MeetingStatus } from "../enums";

export const getOne = query({
  args: { nanoId: v.string(), secret: v.string() },
  handler: async ({ db }, { nanoId, secret }) => {
    if (secret !== process.env.INTERNAL_WEBHOOK_SECRET)
      throw new Error("Unauthorized");

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    return meeting ?? null;
  },
});

export const update = mutation({
  args: {
    secret: v.string(),
    nanoId: v.string(),
    status: MeetingStatus,
    endedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    transcriptUrl: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    // clinicalNote: v.optional(v.string()),
    structuredClinicalNoteJson: v.optional(v.string()),
    structuredClinicalNoteJsonOriginal: v.optional(v.string()),
    statusProcessingData: v.optional(
      v.object({
        statusMessageShort: v.string(),
        statusMessageLong: v.string(),
        progressFraction: v.number(),
        progressStep: v.number(),
        totalSteps: v.number(),
        completedStepsList: v.array(v.string()),
      })
    ),
  },
  handler: async (
    { db },
    {
      secret,
      nanoId,
      status,
      endedAt,
      startedAt,
      transcriptUrl,
      recordingUrl,
      summary,
      // clinicalNote,
      structuredClinicalNoteJson,
      structuredClinicalNoteJsonOriginal,
      statusProcessingData,
    }
  ) => {
    if (secret !== process.env.INTERNAL_WEBHOOK_SECRET)
      throw new Error("Unauthorized");

    const meeting = await db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .first();

    if (!meeting) return null;

    await db.patch(meeting._id, {
      status,
      endedAt: endedAt ?? meeting.endedAt,
      startedAt: startedAt ?? meeting.startedAt,
      transcriptUrl: transcriptUrl ?? meeting.transcriptUrl,
      recordingUrl: recordingUrl ?? meeting.recordingUrl,
      updatedAt: Date.now(),
      summary: summary ?? meeting.summary,
      // clinicalNote: clinicalNote ?? meeting.clinicalNote,
      structuredClinicalNoteJson:
        structuredClinicalNoteJson ?? meeting.structuredClinicalNoteJson,
      structuredClinicalNoteJsonOriginal:
        structuredClinicalNoteJsonOriginal ??
        meeting.structuredClinicalNoteJsonOriginal,
      statusProcessingData:
        statusProcessingData ?? meeting.statusProcessingData,
    });
    return { ok: true };
  },
});
