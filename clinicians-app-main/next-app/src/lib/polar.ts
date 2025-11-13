import { Polar } from "@polar-sh/sdk";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("Missing POLAR_ACCESS_TOKEN environment variable");
}

export const polar = new Polar({
  server: process.env.POLAR_SERVER == "production" ? "production" : "sandbox",
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

// SOME UTILS
// const _auth = await auth();

// let currentSubscription: CustomerStateSubscription | null = null;
// let currentProduct: Product | null = null;
// if (_auth.userId) {
//   try {
//     const customerState = await polar.customers.getStateExternal({
//       externalId: _auth.userId,
//     });
//     currentSubscription = customerState.activeSubscriptions[0];
//   } catch (error) {
//     console.log("No current subscription found for user in Polar");
//   }
// }

// if (currentSubscription) {
//   try {
//     currentProduct = await polar.products.get({
//       id: currentSubscription.productId,
//     });
//   } catch (error) {
//     console.log("No current product found for subscription in Polar");
//   }
// }

// I want a util called hasActiveSubscriptionOnPolar that given a userId (externalId) returns a boolean indicating if the user has an active subscription on Polar
export async function hasActiveSubscriptionOnPolar(
  externalId: string
): Promise<boolean> {
  try {
    const customerState = await polar.customers.getStateExternal({
      externalId,
    });
    return customerState.activeSubscriptions.length > 0;
  } catch (error) {
    console.log(
      `Error fetching customer state for externalId ${externalId}:`,
      error
    );
    return false;
  }
}
