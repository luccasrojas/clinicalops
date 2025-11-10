import { getClerkAuthenticatedTokenServer } from "@/lib/utils-clerk-server";
import TemplateForm from "@/modules/templates/components/template-form";
import { api } from "@convexdev/_generated/api";
import { preloadQuery } from "convex/nextjs";
import React from "react";
import { TemplateFormPreloaded } from "./_components/template-form-preloaded";
import { hasActiveSubscriptionOnPolar } from "@/lib/polar";
import { auth } from "@clerk/nextjs/server";

const Page = async () => {
  const token = await getClerkAuthenticatedTokenServer();
  // a bit redundant but I need it damn it
  const _auth = await auth();

  if (!token || !_auth.userId) {
    return (
      <div>{"Por favor, inicie sesión para personalizar su dashboard."}</div>
    );
  }

  const preloadedDefaultTemplate = await preloadQuery(
    api.prartis.templates.getDefault,
    {},
    {
      token,
    }
  );

  const hasSubscription = await hasActiveSubscriptionOnPolar(_auth.userId);

  return (
    <div>
      <TemplateFormPreloaded
        preloadedDefaultTemplate={preloadedDefaultTemplate}
        hasSubscription={hasSubscription}
      />
    </div>
  );
};

export default Page;
