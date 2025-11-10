import { Polar } from "@polar-sh/sdk";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  action,
  httpAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import schema from "./schema";

const createCheckout = async ({
  externalCustomerId,
  customerEmail,
  // productPriceId,
  productIds,
  successUrl,
  metadata,
}: {
  externalCustomerId: string;
  customerEmail: string;
  // productPriceId: string;
  productIds: string[];
  successUrl: string;
  metadata?: Record<string, string>;
}) => {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }

  const polar = new Polar({
    server: process.env.POLAR_SERVER == "production" ? "production" : "sandbox",
    accessToken: process.env.POLAR_ACCESS_TOKEN,
  });

  const result = await polar.checkouts.create({
    externalCustomerId,
    products: productIds,
    successUrl,
    customerEmail,
    metadata,
  });

  return result;
};

export const getPlanByKey = internalQuery({
  args: {
    key: schema.tables.plans.validator.fields.key,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("plans")
      .withIndex("key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const getPaidPlanOnboardingCheckoutUrl = action({
  args: {
    priceId: v.any(),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const metadata = {
      userId: identity.subject,
      userEmail: identity.email,
      tokenIdentifier: identity.subject,
      // plan: "pro", // legacy
      plan: "deprecated-rely-on-productId-instead", // keeping for backward compatibility
    };

    const successUrl = `${process.env.FRONTEND_URL}/dashboard/upgrade`;
    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL is not configured");
    }

    console.log("Creating checkout for:", metadata);

    console.log("successUrl:", successUrl);

    console.log("priceId:", args.priceId);

    if (!args.priceId) {
      throw new Error("priceId is required");
    }

    const checkout = await createCheckout({
      externalCustomerId: identity.subject,
      customerEmail: identity.email!,
      // I feel maybe later I may still specify a specific price, but product is
      // required for now
      // productPriceId: args.priceId,
      productIds: [args.productId],
      successUrl,
      metadata: metadata as Record<string, string>,
    });

    return checkout.url;
  },
});

// TODO: Forget it, get this damn data from Polar directly if you can help it
// I dont trust our own webhooks enough
export const getUserSubscriptionStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { hasActiveSubscription: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const getUserSubscription = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    return subscription;
  },
});

export const getCustomerPortalUrl = action({
  handler: async (ctx, args: { customerId: string }) => {
    const polar = new Polar({
      server:
        process.env.POLAR_SERVER == "production" ? "production" : "sandbox",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
    });

    try {
      console.log("Creating customer portal session for:", args.customerId);
      if (!args.customerId) {
        throw new Error("customerId is required");
      }

      const result = await polar.customerSessions.create({
        // customerId: args.customerId,
        externalCustomerId: args.customerId, // we are using our IDs, not Polar's
      });

      // Only return the URL to avoid Convex type issues
      return { url: result.customerPortalUrl };
    } catch (error) {
      console.error("Error creating customer session:", error);
      throw new Error("Failed to create customer session");
    }
  },
});
