"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { CheckCircle2, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/../convex/_generated/api";

import { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";

interface Price {
  id: string;
  priceAmount: number;
  recurringInterval: "month" | "year";
  productId: string;
  amountType: "fixed" | "metered_unit";
  unitAmount?: number;
}

interface Product {
  createdAt: Date;
  modifiedAt: Date | null;
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  isArchived: boolean;
  organizationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  prices: Price[];
  benefits: Array<{ description: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  medias: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachedCustomFields: any[];
}

interface PricingProps {
  result: {
    items: Product[];
    pagination: {
      totalCount: number;
      maxPage: number;
    };
  };
  currentSubscription: CustomerStateSubscription | null;
}

type PricingSwitchProps = {
  onSwitch: (value: string) => void;
};

// 👇 added enum exactly for the fix, nothing else
enum ActionType {
  CHECKOUT = "checkout",
  MANAGE = "manage",
  CHANGE = "change",
}

// 👇 added new enum for 3 modes
enum BillingMode {
  MONTHLY = "0",
  YEARLY = "1",
  METERED = "2",
}

type PricingCardProps = {
  // Ignore any warning
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // We keep this as any since it comes from Clerk
  isYearly?: boolean;
  title: string;
  prices: Price[];
  description: string;
  features: string[];
  actionLabel: string;
  actionType: ActionType; // 👈 added
  popular?: boolean;
  exclusive?: boolean;
  billingMode?: BillingMode; // 👈 added
};

const PricingHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="text-center mb-10-cancel mb-8">
    {/* Pill badge */}
    {false && (
      <div className="mx-auto w-fit rounded-full border border-accent bg-accent/10 dark:bg-blue-900/30 px-4 py-1 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-accent ">
          <DollarSign className="h-4 w-4" />
          <span>Precios</span>
        </div>
      </div>
    )}

    {false && (
      <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-accent to-white pb-2">
        {title}
      </h2>
    )}
    <p
      className="mt-4-cancel mt-2 max-w-2xl mx-auto"
      style={
        {
          // border: "2px solid brown",
        }
      }
    >
      {subtitle}
    </p>
  </div>
);

// 👇 adjusted switch with 3 values and removed gray border
const PricingSwitch = ({ onSwitch }: PricingSwitchProps) => (
  <div className="flex justify-center items-center gap-3">
    <Tabs
      defaultValue={BillingMode.MONTHLY}
      className="w-[400px]"
      onValueChange={onSwitch}
    >
      <TabsList className="w-full border-0">
        <TabsTrigger
          value={BillingMode.MONTHLY}
          className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Mensual
        </TabsTrigger>
        <TabsTrigger
          value={BillingMode.YEARLY}
          className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Anual
        </TabsTrigger>
        <TabsTrigger
          value={BillingMode.METERED}
          className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Por uso
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
);

const PricingCard = ({
  user,
  isYearly,
  title,
  prices,
  description,
  features,
  actionLabel,
  actionType, // 👈 added
  popular,
  exclusive,
  billingMode, // 👈 added
}: PricingCardProps) => {
  const router = useRouter();
  const getPaidPlanCheckoutUrl = useAction(
    api.subscriptions.getPaidPlanOnboardingCheckoutUrl
  );

  const getCustomerPortalUrl = useAction(
    api.subscriptions.getCustomerPortalUrl
  );

  // 👇 updated to support metered
  const currentPrice = prices.find((price) => {
    if (billingMode === BillingMode.METERED)
      return price.amountType === "metered_unit";
    return isYearly
      ? price.recurringInterval === "year" && price.amountType === "fixed"
      : price.recurringInterval === "month" && price.amountType === "fixed";
  });

  const priceAmount = currentPrice
    ? (currentPrice.priceAmount / 100).toFixed(2)
    : 0;

  const unitAmount =
    currentPrice && currentPrice.unitAmount
      ? (currentPrice.unitAmount / 100).toFixed(2)
      : 0;

  // 👇 new unified action handler — logs preserved, logic unchanged
  const handleAction = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    try {
      switch (actionType) {
        case ActionType.CHECKOUT:
          console.log("➡️ handleCheckout triggered for", title);
          if (!currentPrice?.id) {
            console.error("No price ID available");
            return;
          }
          {
            const checkoutUrl = await getPaidPlanCheckoutUrl({
              priceId: currentPrice.id,
              productId: currentPrice.productId,
            });
            if (checkoutUrl) {
              window.location.href = checkoutUrl;
            }
          }
          break;

        case ActionType.MANAGE:
          console.log("➡️ handleManageSubscription triggered for", title);
          {
            const portalUrlResult = await getCustomerPortalUrl({
              customerId: user.id,
            });
            if (portalUrlResult) {
              window.location.href = portalUrlResult.url;
            }
          }
          break;

        case ActionType.CHANGE:
          console.log("➡️ handleChangePlan (same portal) triggered for", title);
          {
            const portalUrlResult = await getCustomerPortalUrl({
              customerId: user.id,
            });
            if (portalUrlResult) {
              window.location.href = portalUrlResult.url;
            }
          }
          break;
      }
    } catch (error) {
      console.error("Failed to perform subscription action:", error);
    }
  };

  return (
    <Card
      className={cn(
        "relative w-full max-w-sm mx-4 transition-all duration-300 hover:scale-105",
        {
          "border-2 border-accent shadow-lg": popular,
          "bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl":
            exclusive,
          "hover:shadow-lg": !exclusive,
        }
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-fit rounded-full bg-accent px-4 py-1">
          <p className="text-sm font-medium text-white">{"Más popular"}</p>
        </div>
      )}

      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription
          className={cn("text-base", {
            "text-gray-300": exclusive,
          })}
        >
          {/* {JSON.stringify(prices)} */}
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 👇 added conditional for metered */}
        {billingMode === BillingMode.METERED ? (
          <>
            <p className="text-lg font-semibold text-accent">
              Cobro a final de mes
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn("text-5xl font-bold tracking-tight", {
                  "text-white": exclusive,
                })}
              >
                ${unitAmount}
              </span>
              <span
                className={cn("text-lg text-muted-foreground", {
                  "text-gray-300": exclusive,
                })}
              >
                {/* /{"sesión"}/{isYearly ? "año" : "mes"} */}/{"nota clínica"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={cn("text-5xl font-bold tracking-tight", {
                "text-white": exclusive,
              })}
            >
              ${priceAmount}
            </span>
            <span
              className={cn("text-lg text-muted-foreground", {
                "text-gray-300": exclusive,
              })}
            >
              /{isYearly ? "año" : "mes"}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2
                className={cn("h-5 w-5 flex-shrink-0 text-accent", {
                  "text-blue-400": exclusive,
                })}
              />
              <p
                className={cn("text-sm text-muted-foreground", {
                  "text-gray-300": exclusive,
                })}
              >
                {feature}
              </p>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          onClick={handleAction} // 👈 replaces old onClick
          className={cn("w-full text-base font-semibold", {
            "bg-accent hover:bg-accent/90 text-white": popular,
            "bg-white text-gray-900 hover:bg-gray-100": exclusive,
          })}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Pricing({ result, currentSubscription }: PricingProps) {
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [billingMode, setBillingMode] = useState<BillingMode>(
    BillingMode.MONTHLY
  ); // 👈 added
  const [plans, setPlans] = useState<
    Omit<PricingCardProps, "user" | "isYearly" | "billingMode">[]
  >([]); // 👈 corrected
  const [isLoading, setIsLoading] = useState(true);
  const [hasYearlyPlans, setHasYearlyPlans] = useState(false);
  const { user } = useUser();

  const togglePricingPeriod = (value: string) => {
    setBillingMode(value as BillingMode);
    setIsYearly(value === BillingMode.YEARLY);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const hasYearly = result.items.some((product) =>
          product.prices.some((price) => price.recurringInterval === "year")
        );
        setHasYearlyPlans(hasYearly);

        if (isYearly && !hasYearly) {
          setIsYearly(false);
        }

        const formattedPlans = result.items
          .map((product) => {
            const isCurrentProduct =
              currentSubscription?.productId === product.id;
            const isPaidPlan = !!currentSubscription;
            let buttonText = "Comenzar";
            let actionType = ActionType.CHECKOUT;
            if (isCurrentProduct) {
              buttonText = "Gestionar";
              actionType = ActionType.MANAGE;
            } else if (isPaidPlan) {
              buttonText = "Cambiar plan";
              actionType = ActionType.CHANGE;
            }

            return {
              title: product.name,
              prices: product.prices,
              description: product.description || "No description available",
              features: product.benefits.map(
                (benefit) => benefit.description
              ) || [
                "Todas las funciones básicas",
                "Hasta 20 miembros del equipo",
                "50GB de almacenamiento",
                "Soporte prioritario",
                "Analíticas avanzadas",
              ],
              actionLabel: buttonText,
              actionType,
              popular: product.metadata.popular === "true" ? true : false,
            };
          })
          // sort by price ascending
          .toSorted((a, b) => {
            const aPrice = a.prices.find((price) =>
              isYearly
                ? price.recurringInterval === "year"
                : price.recurringInterval === "month"
            )?.priceAmount;
            const bPrice = b.prices.find((price) =>
              isYearly
                ? price.recurringInterval === "year"
                : price.recurringInterval === "month"
            )?.priceAmount;
            return (aPrice || 0) - (bPrice || 0);
          });

        setPlans(formattedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [result, isYearly]);

  if (isLoading) {
    return (
      <section
        className="px-4"
        style={
          {
            // border: "2px solid green",
          }
        }
      >
        <div className="max-w-7xl mx-auto">
          <PricingHeader
            title="Elige tu plan"
            subtitle="Cada plan te ofrece los siguientes beneficios cada mes:"
          />
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section className="px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <PricingHeader
            title="No Plans Available"
            subtitle="Please set up your products in the Polar dashboard to display pricing plans."
          />
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() =>
                window.open("https://polar.sh/dashboard", "_blank")
              }
              variant={"accent"}
            >
              Setup Products in Polar
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="px-4 py-4"
      style={
        {
          // border: "2px solid green",
        }
      }
    >
      <div
        className="max-w-7xl mx-auto"
        style={
          {
            // border: "2px solid red",
          }
        }
      >
        <PricingHeader
          title="Elige tu plan"
          subtitle="Cada plan te ofrece los siguientes beneficios cada mes:"
        />
        {hasYearlyPlans && (
          <div className="mt-4-cancel mt-0 mb-12">
            <PricingSwitch onSwitch={togglePricingPeriod} />
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
          {plans
            .filter((plan) => {
              return plan.prices.some((price) => {
                if (billingMode === BillingMode.METERED) {
                  return price.amountType === "metered_unit";
                } else if (isYearly == true) {
                  return (
                    price.recurringInterval === "year" &&
                    price.amountType == "fixed"
                  );
                } else {
                  return (
                    price.recurringInterval === "month" &&
                    price.amountType == "fixed"
                  );
                }
              });
            })
            .map((plan) => (
              <PricingCard
                key={plan.title}
                user={user}
                {...plan}
                isYearly={isYearly}
                billingMode={billingMode} // 👈 added
              />
            ))}
        </div>
      </div>
    </section>
  );
}
