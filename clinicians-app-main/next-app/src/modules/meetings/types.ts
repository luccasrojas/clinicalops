import z from "zod";
// import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
// REMEMBER: You can export the generated api, but never export stuff from convex/agents.ts in the frontend
import { api } from "../../../convex/_generated/api";
import { createAgentSchema } from "@convexdev/zod/zodSchema";
import { MeetingStatus } from "../../../convex/enums";

// this is useless, not needed in Convex
// export type AgentGetOne = typeof api.agents.getOne;

// export type Agent = Doc<"agents">;

// export type CreateAgentFormValues = z.infer<typeof createAgentSchema>;
// I should have known...
export type CreateMeetingFormValues = typeof api.meetings.create._args;

// export type MeetingGetOne = Doc<"meetings">;
// https://chatgpt.com/c/68e2493a-6230-8322-a0d7-23d03799be17
export type MeetingGetOne = NonNullable<typeof api.meetings.getOne._returnType>;
export type MeetingGetMany = NonNullable<
  typeof api.meetings.getMany._returnType.items
>;

// not really appropriate, in convex columns are not selected

// export enum MeetingStatus {
//   Upcoming = "upcoming",
//   Active = "active",
//   Completed = "completed",
//   Cancelled = "cancelled",
//   Processing = "processing",
// }

export type MeetingStatusType = typeof MeetingStatus.type;

export enum MeetingStatusEnum {
  Upcoming = "upcoming",
  Active = "active",
  Completed = "completed",
  Cancelled = "cancelled",
  Processing = "processing",
}

export type StreamTranscriptItem = {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
};
