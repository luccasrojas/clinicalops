// import Pricing from "@/components/sections/pricing";
import Pricing from "@/components/pricing";
//kinda dagerous to import this in the wrong place
// this is fine because it's a server component
import { polar } from "@/lib/polar";
import { auth } from "@clerk/nextjs/server";
import { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
import { Product } from "@polar-sh/sdk/models/components/product.js";

// import type { CustomerStateSubscription } from "@polar-sh/sdk"; // adjust path if different

interface PolarSubscriptionMetadata {
  plan: string;
  userId: string;
  userEmail: string;
  tokenIdentifier: string;
  [k: string]: string | number | boolean;
}

export default async function Home() {
  const { result } = await polar.products.list({
    organizationId: process.env.POLAR_ORGANIZATION_ID,
    isArchived: false,
  });

  const _auth = await auth();

  let currentSubscription: CustomerStateSubscription | null = null;
  let currentProduct: Product | null = null;
  if (_auth.userId) {
    try {
      const customerState = await polar.customers.getStateExternal({
        externalId: _auth.userId,
      });
      currentSubscription = customerState.activeSubscriptions[0];
    } catch (error) {
      console.log("No current subscription found for user in Polar");
    }
  }

  if (currentSubscription) {
    try {
      currentProduct = await polar.products.get({
        id: currentSubscription.productId,
      });
    } catch (error) {
      console.log("No current product found for subscription in Polar");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* {JSON.stringify(result, null, 2)} */}
      {/* Pricing Section */}
      <div
        className="flex-1 pt-4 px-4 md:px-8 flex flex-col gap-y-10"
        style={
          {
            // border: "2px dotted red",
          }
        }
      >
        <div
          className="mt-4 flex-1 flex flex-col gap-y-10 items-center"
          style={
            {
              // border: "2px dotted green",
            }
          }
        >
          <SubscriptionLabel
            currentSubscription={currentSubscription}
            currentProduct={currentProduct}
          />
          {/* {JSON.stringify(currentSubscription, null, 2)} */}
        </div>
      </div>
      <Pricing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result={result as any}
        currentSubscription={currentSubscription}
      />
    </div>
  );
}

interface PolarSubscriptionMetadata {
  plan: string;
  userId: string;
  userEmail: string;
  tokenIdentifier: string;
}

interface SubscriptionLabelProps {
  currentSubscription: CustomerStateSubscription | null;
  currentProduct: Product | null;
}

const SubscriptionLabel = ({
  currentSubscription,
  currentProduct,
}: SubscriptionLabelProps) => {
  if (!currentSubscription) {
    // 🩵 Fallback when there's no active subscription
    return (
      <h5 className="font-medium text-2xl md:text-3xl">
        Estás en la prueba{" "}
        <span className="text-accent font-semibold capitalize">Gratis</span>
      </h5>
    );
  }

  // Only show interval for month/year
  const interval =
    currentSubscription.recurringInterval === "month"
      ? "mensual"
      : currentSubscription.recurringInterval === "year"
      ? "anual"
      : null;

  // const plan =
  //   (
  //     currentSubscription.metadata as PolarSubscriptionMetadata
  //   )?.plan?.toLowerCase?.() ?? "gratuito";
  if (!currentProduct) {
    return "No-Product-Name-Error";
  }
  const plan = currentProduct.name.toLowerCase() ?? "gratuito";

  return (
    <h5 className="font-medium text-2xl md:text-3xl">
      Estás en el plan {interval && <>{interval} </>}
      <span className="text-accent font-semibold capitalize">{plan}</span>
    </h5>
  );
  //TODO: add cancel at period end notice if applicable in red text
};
