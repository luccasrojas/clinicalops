import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { MeetingStatus } from "./enums";

// export default defineSchema({
//   users: defineTable({
//     name: v.string(),
//     test: v.optional(v.string()),
//   }),
// });

// Define a price object structure that matches your data
const priceValidator = v.object({
  amount: v.number(),
  polarId: v.string(),
});

// Define a prices object structure for a specific interval
const intervalPricesValidator = v.object({
  usd: priceValidator,
});

export default defineSchema(
  {
    users: defineTable({
      createdAt: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      userId: v.string(),
      subscription: v.optional(v.string()),
      credits: v.optional(v.string()),
      tokenIdentifier: v.string(),
    }).index("by_token", ["tokenIdentifier"]),
    // we'll use products table instead of plans
    plans: defineTable({
      key: v.string(),
      name: v.string(),
      description: v.string(),
      polarProductId: v.string(),
      prices: v.object({
        month: v.optional(intervalPricesValidator),
        year: v.optional(intervalPricesValidator),
      }),
    })
      .index("key", ["key"])
      .index("polarProductId", ["polarProductId"]),
    products: defineTable({
      id: v.string(),
      createdAt: v.string(),
      modifiedAt: v.union(v.string(), v.null()),
      name: v.string(),
      description: v.union(v.string(), v.null()),
      recurringInterval: v.optional(
        v.union(
          v.literal("month"),
          v.literal("year"),
          v.literal("week"),
          v.literal("day"),
          v.null()
        )
      ),
      isRecurring: v.boolean(),
      isArchived: v.boolean(),
      organizationId: v.string(),
      metadata: v.optional(v.record(v.string(), v.any())),
      prices: v.array(
        v.object({
          id: v.string(),
          createdAt: v.string(),
          modifiedAt: v.union(v.string(), v.null()),
          amountType: v.optional(v.string()),
          isArchived: v.boolean(),
          productId: v.string(),
          priceCurrency: v.optional(v.string()),
          priceAmount: v.optional(v.number()),
          type: v.optional(v.string()),
          recurringInterval: v.optional(
            v.union(
              v.literal("month"),
              v.literal("year"),
              v.literal("week"),
              v.literal("day"),
              v.null()
            )
          ),
        })
      ),
      medias: v.array(
        v.object({
          id: v.string(),
          organizationId: v.string(),
          name: v.string(),
          path: v.string(),
          mimeType: v.string(),
          size: v.number(),
          storageVersion: v.union(v.string(), v.null()),
          checksumEtag: v.union(v.string(), v.null()),
          checksumSha256Base64: v.union(v.string(), v.null()),
          checksumSha256Hex: v.union(v.string(), v.null()),
          createdAt: v.string(),
          lastModifiedAt: v.union(v.string(), v.null()),
          version: v.union(v.string(), v.null()),
          service: v.optional(v.string()),
          isUploaded: v.boolean(),
          sizeReadable: v.string(),
          publicUrl: v.string(),
        })
      ),
      raw: v.string(),
    })
      .index("id", ["id"])
      .index("isArchived", ["isArchived"]),
    subscriptions: defineTable({
      userId: v.optional(v.string()),
      polarId: v.optional(v.string()),
      polarPriceId: v.optional(v.string()),
      currency: v.optional(v.string()),
      interval: v.optional(v.string()),
      status: v.optional(v.string()),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      amount: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      endsAt: v.optional(v.number()),
      endedAt: v.optional(v.number()),
      canceledAt: v.optional(v.number()),
      customerCancellationReason: v.optional(v.string()),
      customerCancellationComment: v.optional(v.string()),
      metadata: v.optional(v.any()),
      customFieldData: v.optional(v.any()),
      customerId: v.optional(v.string()),
      // Inspiration from https://github.com/get-convex/polar/blob/main/src/component/schema.ts
      // https://github.com/get-convex/polar/blob/1d65712af9767ea446abff45e16aefbed00bb564/src/component/schema.ts#L4
      polarProductId: v.string(), // this is separate from priceId (which I named polarPriceId)
    })
      .index("userId", ["userId"])
      .index("polarId", ["polarId"]),
    // Rename later to polarWebhookEvents // definitely a much better name
    webhookEvents: defineTable({
      type: v.string(),
      polarEventId: v.string(),
      createdAt: v.string(),
      modifiedAt: v.string(),
      data: v.any(),
    })
      .index("type", ["type"])
      .index("polarEventId", ["polarEventId"]),
    //
    chat_sessions: defineTable({
      created_at: v.string(), // ISO date string
      id: v.string(), // UUID
      title: v.string(),
      updated_at: v.string(),
      user_id: v.string(),
    }).index("by_user", ["user_id"]),

    cie10_diagnoses: defineTable({
      category: v.optional(v.string()),
      code: v.string(),
      created_at: v.string(),
      description: v.string(),
      id: v.string(), // UUID
    }).index("by_code", ["code"]),

    clinical_notes: defineTable({
      audio_duration: v.optional(v.number()),
      created_at: v.string(),
      id: v.string(),
      structured_note: v.optional(v.string()),
      title: v.string(),
      transcription: v.string(),
      updated_at: v.string(),
      user_id: v.string(),
    }).index("by_user", ["user_id"]),

    note_diagnoses: defineTable({
      created_at: v.string(),
      diagnosis_code: v.string(), // FK -> cie10_diagnoses.code
      id: v.string(),
      is_primary: v.optional(v.boolean()),
      note_id: v.string(), // FK -> clinical_notes.id
    })
      .index("by_note", ["note_id"])
      .index("by_diagnosis_code", ["diagnosis_code"]),

    profiles: defineTable({
      created_at: v.string(),
      first_name: v.optional(v.string()),
      id: v.string(), // probably should get rid of this
      institution: v.optional(v.string()),
      last_name: v.optional(v.string()),
      medical_license: v.optional(v.string()),
      specialty: v.optional(v.string()),
      updated_at: v.string(),
      user_id: v.string(),
    }).index("by_user", ["user_id"]),

    agents: defineTable({
      nanoId: v.string(), // public-facing stable ID
      name: v.string(),
      userId: v.string(), // Clerk user ID (string, not Convex id)
      // can give default instructions for non-artificial agents anyways
      // a value that may or not may be used
      // "You are a sick with x, y, z symptoms. You are consulting with a doctor."
      // Or maybe it should all be the same
      // symptoms, age, etc...
      // we can provide general instructions in back end
      instructions: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      //
      artificial: v.boolean(), // ✅ optional first
    })
      .index("by_user", ["userId"]) // index by Clerk user ID
      .index("by_nanoId", ["nanoId"]) // index by public-facing nanoId
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["userId"],
      }),

    meetings: defineTable({
      nanoId: v.string(), // public-facing stable ID
      name: v.string(),
      userId: v.string(), // Clerk user ID (string, not Convex id)
      agentId: v.id("agents"),
      agentNanoId: v.string(), // denormalized for convenience
      status: MeetingStatus,
      startedAt: v.optional(v.number()),
      endedAt: v.optional(v.number()),
      transcriptUrl: v.optional(v.string()),
      recordingUrl: v.optional(v.string()),
      summary: v.optional(v.string()),
      // clinicalNote: v.optional(v.string()),
      structuredClinicalNoteJson: v.optional(v.string()),
      structuredClinicalNoteJsonOriginal: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      //
      simulation: v.boolean(), // ✅ optional first
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
    })
      .index("by_user", ["userId"]) // index by Clerk user ID
      .index("by_nanoId", ["nanoId"]) // index by public-facing nanoId
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["userId"],
      }),

    // templates for clinical notes
    templates: defineTable({
      nanoId: v.string(), // public-facing stable ID
      name: v.string(),
      clinicalNoteExampleContent: v.string(),
      userId: v.string(), // Clerk user ID (string, not Convex id)
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"]) // index by Clerk user ID
      .index("by_nanoId", ["nanoId"]) // index by public-facing nanoId
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["userId"],
      }),
  },
  {
    // Seems important lol
    schemaValidation: true,
  }
);
