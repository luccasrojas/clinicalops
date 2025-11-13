import z from "zod";
// import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
// REMEMBER: You can export the generated api, but never export stuff from convex/agents.ts in the frontend
import { api } from "../../../convex/_generated/api";
import { createAgentSchema } from "@convexdev/zod/zodSchema";

// this is useless, not needed in Convex
// export type AgentGetOne = typeof api.agents.getOne;

// export type Agent = Doc<"agents">;

// export type CreateAgentFormValues = z.infer<typeof createAgentSchema>;
// I should have known...
export type CreateAgentFormValues = typeof api.agents.create._args;

// export type AgentGetOne = Doc<"agents">;
// https://chatgpt.com/c/68e2493a-6230-8322-a0d7-23d03799be17
export type AgentGetOne = NonNullable<typeof api.agents.getOne._returnType>;
export type AgentGetMany = NonNullable<
  typeof api.agents.getMany._returnType.items
>;

// not really appropriate, in convex columns are not selected
