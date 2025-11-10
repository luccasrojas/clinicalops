import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const paymentWebhook = httpAction(async (ctx, request) => {
  console.log("Webhook received!", {
    method: request.method,
    url: request.url,
    headers: request.headers,
  });

  try {
    const body = await request.json();

    // track events and based on events store data
    await ctx.runMutation(api.polar.webhookEvents.storeWebhookEvent, {
      body,
    });

    console.log("Webhook body:", body);
    return new Response(JSON.stringify({ message: "Webhook received!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("No JSON body or parsing failed");
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});
