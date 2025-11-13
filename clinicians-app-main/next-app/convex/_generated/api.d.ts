/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agents from "../agents.js";
import type * as analytics_meetingsByUser from "../analytics/meetingsByUser.js";
import type * as clinical_notes from "../clinical_notes.js";
import type * as constants from "../constants.js";
import type * as enums from "../enums.js";
import type * as http from "../http.js";
import type * as meetings from "../meetings.js";
import type * as migrations_backfillArtificialAgents from "../migrations/backfillArtificialAgents.js";
import type * as plans from "../plans.js";
import type * as polar_paymentWebhook from "../polar/paymentWebhook.js";
import type * as polar_premium from "../polar/premium.js";
import type * as polar_products from "../polar/products.js";
import type * as polar_utils from "../polar/utils.js";
import type * as polar_webhookEvents from "../polar/webhookEvents.js";
import type * as prartis_templates from "../prartis/templates.js";
import type * as profiles from "../profiles.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as webhooks_agents from "../webhooks/agents.js";
import type * as webhooks_meetings from "../webhooks/meetings.js";
import type * as webhooks_templates from "../webhooks/templates.js";
import type * as zod_templatesSchema from "../zod/templatesSchema.js";
import type * as zod_zodSchema from "../zod/zodSchema.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  "analytics/meetingsByUser": typeof analytics_meetingsByUser;
  clinical_notes: typeof clinical_notes;
  constants: typeof constants;
  enums: typeof enums;
  http: typeof http;
  meetings: typeof meetings;
  "migrations/backfillArtificialAgents": typeof migrations_backfillArtificialAgents;
  plans: typeof plans;
  "polar/paymentWebhook": typeof polar_paymentWebhook;
  "polar/premium": typeof polar_premium;
  "polar/products": typeof polar_products;
  "polar/utils": typeof polar_utils;
  "polar/webhookEvents": typeof polar_webhookEvents;
  "prartis/templates": typeof prartis_templates;
  profiles: typeof profiles;
  subscriptions: typeof subscriptions;
  users: typeof users;
  "webhooks/agents": typeof webhooks_agents;
  "webhooks/meetings": typeof webhooks_meetings;
  "webhooks/templates": typeof webhooks_templates;
  "zod/templatesSchema": typeof zod_templatesSchema;
  "zod/zodSchema": typeof zod_zodSchema;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
