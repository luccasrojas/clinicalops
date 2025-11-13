import { ConvexError } from "convex/values";
import {
  MAX_FREE_AGENTS,
  MAX_FREE_SESSIONS,
  MAX_FREE_SIMULATIONS,
} from "../../shared/constants";
import { query } from "../_generated/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { api } from "../_generated/api";
import { getProductTierFromProductId } from "../constants";
import { getMaxUsageByTier } from "../../shared/utils";

/* -------------------------------------------------------------------------- */
/* 🧩 Shared helpers */
/* -------------------------------------------------------------------------- */

async function getUserAndSubscription(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHORIZED" });

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();

  if (!user)
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
    .first();

  console.log("Subscription", subscription);

  const hasActiveSubscription = subscription?.status === "active";

  console.log("getUserAndSubscription", {
    identity,
    user,
    hasActiveSubscription,
  });

  return { identity, user, hasActiveSubscription };
}

async function getUsage(ctx: QueryCtx | MutationCtx, userId: string) {
  const meetings = await ctx.db
    .query("meetings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const simulationsCount = meetings.filter((m) => m.simulation === true).length;
  const sessionsCount = meetings.length - simulationsCount;

  const agents = await ctx.db
    .query("agents")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((a) => a.eq(a.field("artificial"), true))
    .collect();

  // Get product tier too
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .first();

  let productTier = null;
  if (subscription) {
    productTier = getProductTierFromProductId(subscription.polarProductId);
  }

  return {
    agentsCount: agents.length,
    sessionsCount,
    simulationsCount,
    productTier,
  };
}

/* -------------------------------------------------------------------------- */
/* ✅ Production: getFreeUsage (kept intact) */
/* -------------------------------------------------------------------------- */

export const getFreeUsage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    let product = null; // not sure if I even need this
    let productTier = null;

    if (subscription) {
      // null; // We need to know the product details, this is now the right mental model
      // because the max usage depends on that
      product = await ctx.runQuery(api.polar.products.getProduct, {
        id: subscription.polarProductId,
      });
      productTier = getProductTierFromProductId(subscription.polarProductId);
    }

    const userMeetings = await ctx.db
      .query("meetings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const userMeetingsCount = userMeetings.length;

    const userSimulationsCount = userMeetings.filter(
      (m) => m.simulation == true
    ).length;
    const userSessionsCount = userMeetingsCount - userSimulationsCount;

    const userAgents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((a) => a.eq(a.field("artificial"), true))
      .collect();
    const userAgentsCount = userAgents.length;

    return {
      meetingCount: userMeetingsCount,
      agentCount: userAgentsCount,
      simulationsCount: userSimulationsCount,
      sessionsCount: userSessionsCount,
      productTier,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* ⚙️ Premium guard (your stable version, no edits) */
/* -------------------------------------------------------------------------- */

// export async function _assertPremiumOrWithinFreeLimit(
//   ctx: QueryCtx | MutationCtx,
//   entity: "agents" | "sessions" | "simulations"
// ) {
//   const { identity, hasActiveSubscription } = await getUserAndSubscription(ctx);
//   const usage = await getUsage(ctx, identity.subject);

//   if (hasActiveSubscription) return; // ✅ Premium plan, no checks

//   if (entity === "agents" && usage.agentsCount >= MAX_FREE_AGENTS) {
//     throw new ConvexError({
//       code: "FORBIDDEN",
//       message: `Has alcanzado el límite de ${MAX_FREE_AGENTS} pacientes virtuales (IA) gratuitos. Actualiza a un plan premium para continuar.`,
//     });
//   }

//   if (entity === "sessions" && usage.sessionsCount >= MAX_FREE_SESSIONS) {
//     throw new ConvexError({
//       code: "FORBIDDEN",
//       message: `Has alcanzado el límite de ${MAX_FREE_SESSIONS} sesiones gratuitas. Actualiza a un plan premium para continuar.`,
//     });
//   }

//   if (
//     entity === "simulations" &&
//     usage.simulationsCount >= MAX_FREE_SIMULATIONS
//   ) {
//     throw new ConvexError({
//       code: "FORBIDDEN",
//       message: `Has alcanzado el límite de ${MAX_FREE_SIMULATIONS} simulaciones gratuitas. Actualiza a un plan premium para continuar.`,
//     });
//   }
// }

export async function assertPremiumOrWithinFreeLimit(
  ctx: QueryCtx | MutationCtx,
  entity: "agents" | "sessions" | "simulations"
) {
  const { identity, hasActiveSubscription } = await getUserAndSubscription(ctx);
  const usage = await getUsage(ctx, identity.subject);

  console.log("User usage", usage);
  console.log("Has active subscription", hasActiveSubscription);
  console.log("Entity being created", entity);

  let maxUsage = {
    agents: MAX_FREE_AGENTS,
    sessions: MAX_FREE_SESSIONS,
    simulations: MAX_FREE_SIMULATIONS,
  };

  // if (hasActiveSubscription) return; // ✅ Premium, skip checks // now we always check
  if (hasActiveSubscription) {
    if (!usage.productTier)
      // this should not happen
      throw new ConvexError({
        code: "INTERNAL",
        message: "Product tier not found for active subscription",
      });

    maxUsage = getMaxUsageByTier(usage.productTier);
  }

  // 🧠 Free-tier enforcement
  const violations: Record<typeof entity, boolean> = {
    agents: usage.agentsCount >= maxUsage.agents,
    sessions: usage.sessionsCount >= maxUsage.sessions,
    simulations: usage.simulationsCount >= maxUsage.simulations,
  } as const;

  if (!violations[entity]) return;

  const isFree = hasActiveSubscription === false;

  const messages: Record<typeof entity, string> = {
    agents: isFree
      ? `Has alcanzado el límite de ${maxUsage.agents} pacientes virtuales (IA) gratuitos. Suscríbete para continuar.`
      : `Has alcanzado el límite de ${maxUsage.agents} pacientes virtuales (IA). Actualiza tu plan o contacta soporte para aumentar tu límite.`,
    sessions: isFree
      ? `Has alcanzado el límite de ${maxUsage.sessions} sesiones gratuitas. Suscríbete para continuar.`
      : `Has alcanzado el límite de ${maxUsage.sessions} sesiones. Actualiza tu plan o contacta soporte para aumentar tu límite.`,
    simulations: isFree
      ? `Has alcanzado el límite de ${maxUsage.simulations} simulaciones gratuitas. Suscríbete para continuar.`
      : `Has alcanzado el límite de ${maxUsage.simulations} simulaciones. Actualiza tu plan o contacta soporte para aumentar tu límite.`,
  };

  throw new ConvexError({ code: "FORBIDDEN", message: messages[entity] });
}
