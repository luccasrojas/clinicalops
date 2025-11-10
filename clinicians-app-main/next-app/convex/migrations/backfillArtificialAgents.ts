// convex/migrations/backfillArtificialAgents.ts
import { mutation } from "../_generated/server";

export const backfillArtificialAgents = mutation(async ({ db }) => {
  const agents = await db.query("agents").collect();

  for (const agent of agents) {
    if (agent.artificial === undefined) {
      await db.patch(agent._id, { artificial: true });
    }
  }

  return { updated: agents.length };
});
