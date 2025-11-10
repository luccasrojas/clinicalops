import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";
import { convertToDatabaseProduct } from "./utils";

export const storeWebhookEvent = mutation({
  args: {
    body: v.any(),
  },
  handler: async (ctx, args) => {
    // Extract event type from webhook payload
    const eventType = args.body.type;
    console.log("Received webhook event:", eventType);
    console.log("These are the args", args);

    // Store webhook event
    await ctx.db.insert("webhookEvents", {
      type: eventType,
      polarEventId: args.body.data.id,
      createdAt: args.body.data.created_at,
      modifiedAt: args.body.data.modified_at || args.body.data.created_at,
      data: args.body.data,
    });

    switch (eventType) {
      case "subscription.created":
        // Should probably raise a flag if there is already a subscription with this polarId
        // or userId (if we want to enforce one subscription per user)
        const existing = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (existing) {
          console.warn(
            `Subscription with polarId ${args.body.data.id} already exists. This shouldn't be the case because we are not allowing duplicate subscriptions on Polar's settings.`
          );
          // Delete existing subscription to avoid duplicates
          // await ctx.db.delete(existing._id);
        }
        // Insert new subscription
        await ctx.db.insert("subscriptions", {
          polarId: args.body.data.id,
          polarPriceId: args.body.data.price_id,
          currency: args.body.data.currency,
          interval: args.body.data.recurring_interval,
          userId: args.body.data.metadata.userId,
          status: args.body.data.status,
          currentPeriodStart: new Date(
            args.body.data.current_period_start
          ).getTime(),
          currentPeriodEnd: new Date(
            args.body.data.current_period_end
          ).getTime(),
          cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
          amount: args.body.data.amount,
          startedAt: new Date(args.body.data.started_at).getTime(),
          endedAt: args.body.data.ended_at
            ? new Date(args.body.data.ended_at).getTime()
            : undefined,
          canceledAt: args.body.data.canceled_at
            ? new Date(args.body.data.canceled_at).getTime()
            : undefined,
          customerCancellationReason:
            args.body.data.customer_cancellation_reason || undefined,
          customerCancellationComment:
            args.body.data.customer_cancellation_comment || undefined,
          metadata: args.body.data.metadata || {},
          customFieldData: args.body.data.custom_field_data || {},
          customerId: args.body.data.customer_id,
          // Inspiration from https://github.com/get-convex/polar/blob/main/src/component/schema.ts
          // https://github.com/get-convex/polar/blob/1d65712af9767ea446abff45e16aefbed00bb564/src/component/schema.ts#L4
          polarProductId: args.body.data.product_id,
        });
        break;

      case "subscription.updated":
        // Find existing subscription
        const existingSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        // NOTE: Be careful, if you delete customers from Polar, the subscription may still exist in our DB with a polarId that no longer exists in Polar.
        // In that case, we won't find it here, and we won't update it which is a problem because we'll have multiple subscriptions for the same user.
        // More precisely, we may update the subscription with stale data.
        // To avoid this, we should probably delete subscriptions when a customer is deleted.

        if (existingSub) {
          await ctx.db.patch(existingSub._id, {
            amount: args.body.data.amount,
            status: args.body.data.status,
            currentPeriodStart: new Date(
              args.body.data.current_period_start
            ).getTime(),
            currentPeriodEnd: new Date(
              args.body.data.current_period_end
            ).getTime(),
            cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
            metadata: args.body.data.metadata || {},
            customFieldData: args.body.data.custom_field_data || {},
          });
        }
        break;

      case "subscription.active":
        // Find and update subscription
        const activeSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (activeSub) {
          await ctx.db.patch(activeSub._id, {
            status: args.body.data.status,
            startedAt: new Date(args.body.data.started_at).getTime(),
          });
        }
        break;

      case "subscription.canceled":
        // Find and update subscription
        const canceledSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (canceledSub) {
          await ctx.db.patch(canceledSub._id, {
            status: args.body.data.status,
            canceledAt: args.body.data.canceled_at
              ? new Date(args.body.data.canceled_at).getTime()
              : undefined,
            customerCancellationReason:
              args.body.data.customer_cancellation_reason || undefined,
            customerCancellationComment:
              args.body.data.customer_cancellation_comment || undefined,
          });
        }
        break;

      case "subscription.uncanceled":
        // Find and update subscription
        const uncanceledSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (uncanceledSub) {
          await ctx.db.patch(uncanceledSub._id, {
            status: args.body.data.status,
            cancelAtPeriodEnd: false,
            canceledAt: undefined,
            customerCancellationReason: undefined,
            customerCancellationComment: undefined,
          });
        }
        break;

      case "subscription.revoked":
        // Find and update subscription
        const revokedSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (revokedSub) {
          await ctx.db.patch(revokedSub._id, {
            status: "revoked",
            endedAt: args.body.data.ended_at
              ? new Date(args.body.data.ended_at).getTime()
              : undefined,
          });
        }
        break;

      case "order.created":
        console.log("order.created:", args.body);
        // Orders are handled through the subscription events
        break;

      case "customer.deleted":
        // When a customer is deleted, we should probably mark all their subscriptions as "revoked" or delete them
        const customerId = args.body.data.id;
        const subs = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", customerId))
          .collect();

        for (const sub of subs) {
          // await ctx.db.patch(sub._id, {
          //   status: "revoked",
          //   endedAt: new Date().getTime(),
          // });
          // Nope, delete it all
          await ctx.db.delete(sub._id);
        }
        break;

      case "product.created": {
        await ctx.runMutation(api.polar.products.createProduct, {
          product: convertToDatabaseProduct(args.body.data),
        });
        break;
      }

      case "product.updated": {
        await ctx.runMutation(api.polar.products.updateProduct, {
          product: convertToDatabaseProduct(args.body.data),
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
        break;
    }
  },
});
