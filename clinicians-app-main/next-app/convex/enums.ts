// convex/enums.ts
import { v } from "convex/values";

export const MeetingStatus = v.union(
  v.literal("upcoming"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("processing"),
  v.literal("failed")
);
