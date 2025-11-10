"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@convexdev/_generated/api";
import {
  RocketIcon,
  CrownIcon,
  ZapIcon, // example alternate icons
  PlugZapIcon,
  GemIcon,
} from "lucide-react";
import {
  MAX_FREE_AGENTS,
  MAX_FREE_SESSIONS,
  MAX_FREE_SIMULATIONS,
} from "@shared/constants";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getMaxUsageByTier } from "@shared/utils";
import { useUser } from "@clerk/nextjs";
import { ProductTier } from "@shared/types";

export const DashboardTrial = () => {
  const router = useRouter();
  const getCustomerPortalUrl = useAction(
    api.subscriptions.getCustomerPortalUrl
  );
  const freeUsageData = useQuery(api.polar.premium.getFreeUsage);
  const { user } = useUser();
  const notesStatsData = useQuery(
    api.meetings.getMeetingsWithClinicalNotesStats
  );

  let maxUsage = {
    sessions: MAX_FREE_SESSIONS,
    simulations: MAX_FREE_SIMULATIONS,
    agents: MAX_FREE_AGENTS,
  };

  if (freeUsageData && freeUsageData.productTier) {
    maxUsage = getMaxUsageByTier(freeUsageData.productTier);
  }

  if (!freeUsageData) return null;

  const handleSubscribeClick = async () => {
    if (freeUsageData.productTier && user?.id) {
      try {
        const portalResult = await getCustomerPortalUrl({
          customerId: user.id,
        });
        if (portalResult?.url) router.push(portalResult.url);
      } catch (error) {
        console.error("Failed to get customer portal URL:", error);
      }
    } else {
      router.push("/dashboard/upgrade");
    }
  };

  // 🧠 Determine if plan is "unlimited-feeling"
  const isHighTier =
    freeUsageData.productTier === ProductTier.PRO ||
    freeUsageData.productTier === ProductTier.PAY_AS_YOU_GO;

  // 🖼️ Dynamic icon + color
  // const TierIcon = isHighTier ? GemIcon : RocketIcon;
  // RocketIcon is default, Gem is for PRO, ZapIcon for PAY_AS_YOU_GO
  let TierIcon = RocketIcon;
  if (freeUsageData.productTier === ProductTier.PRO) {
    TierIcon = GemIcon;
  } else if (freeUsageData.productTier === ProductTier.PAY_AS_YOU_GO) {
    TierIcon = PlugZapIcon;
  }

  const tierColorClass = isHighTier
    ? "text-black border-black"
    : "text-accent border-accent";
  const buttonVariant = isHighTier ? "default" : "accent";
  const monthTextColorClass = isHighTier
    ? "text-muted-foreground"
    : "text-accent";

  return (
    <div
      className={`border rounded-sm w-full flex flex-col gap-y-2 ${tierColorClass}`}
    >
      <div
        className={`p-3 flex flex-col gap-y-4 ${
          isHighTier ? "text-black" : "text-accent"
        }`}
      >
        <div className="flex items-center gap-2">
          <TierIcon className="flex items-center gap-2" />
          <div className="flex flex-col leading-tight">
            <p
              className={`text-sm font-medium ${
                freeUsageData.productTier == null ? "" : "font-semibold"
              }`}
            >
              {freeUsageData.productTier == null
                ? "Prueba gratis"
                : `Plan ${productTierToSpanish(freeUsageData.productTier)}`}
              {/* Add current month of the year in Spanish in parenthesis with datetime */}
              {/* {freeUsageData.productTier != null && (
              <>
                {" ("}
                {`${new Date()
                  .toLocaleString("es-ES", { month: "short" })
                  .replace(/\./g, "")
                  .toUpperCase()
                  .slice(0, 3)}`}
                {")"}
              </>
            )} */}
            </p>
            <p className={`text-xs font-normal ${monthTextColorClass}`}>
              {`${new Date()
                .toLocaleString("es-ES", { month: "long" })
                .replace(/\./g, "")}`}
            </p>
          </div>
        </div>

        {/* Show counters always, progress bars only for low tiers */}
        <div className="flex flex-col gap-y-2">
          <p className="text-xs">
            {freeUsageData.sessionsCount}{" "}
            {!isHighTier && `/${maxUsage.sessions}`} sesiones
            {isHighTier &&
              notesStatsData &&
              ` (${notesStatsData.thisMonth} notas)`}
          </p>
          {!isHighTier && (
            <Progress
              variant="accent"
              value={(freeUsageData.sessionsCount / maxUsage.sessions) * 100}
            />
          )}
        </div>

        <div className="hidden not-flex flex-col gap-y-2">
          <p className="text-xs">
            {freeUsageData.simulationsCount}{" "}
            {!isHighTier && `/${maxUsage.simulations}`} simulaciones (IA)
          </p>
          {!isHighTier && (
            <Progress
              variant="accent"
              value={
                (freeUsageData.simulationsCount / maxUsage.simulations) * 100
              }
            />
          )}
        </div>

        <div className="hidden not-flex flex-col gap-y-2">
          <p className="text-xs">
            {freeUsageData.agentCount} {!isHighTier && `/${maxUsage.agents}`}{" "}
            pacientes virtuales (IA)
          </p>
          {!isHighTier && (
            <Progress
              variant="accent"
              value={(freeUsageData.agentCount / maxUsage.agents) * 100}
            />
          )}
        </div>
      </div>

      <Button
        variant={buttonVariant}
        className="rounded-sm rounded-t-none"
        onClick={handleSubscribeClick}
      >
        {freeUsageData.productTier ? "Gestionar" : "Suscribirse"}
      </Button>
    </div>
  );
};

// Utility: map product tiers to Spanish strings
export const productTierToSpanish = (tier: string) => {
  switch (tier) {
    case "HOBBY":
      return "Hobby";
    case "PLUS":
      return "Plus";
    case "PRO":
      return "Pro";
    case "PAY_AS_YOU_GO":
      return "Pago-por-uso";
    default:
      return "Desconocido";
  }
};
