"use client";
import TemplateForm from "@/modules/templates/components/template-form";
import { api } from "@convexdev/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";

interface TemplateFormPreloadedProps {
  preloadedDefaultTemplate: Preloaded<typeof api.prartis.templates.getDefault>;
  hasSubscription: boolean;
}

export const TemplateFormPreloaded = ({
  preloadedDefaultTemplate,
  hasSubscription,
}: TemplateFormPreloadedProps) => {
  const templateDataPreloadedResult = usePreloadedQuery(
    preloadedDefaultTemplate
  );

  //   const blockedMsg =
  //     "Actualiza a cualquiera de nuestros planes de pago para personalizar.";
  //   const blockedMsg = "Esta función solo está disponible en planes de pago.";
  const blockedMsg =
    "Actualiza a cualquiera de nuestros planes de pago para habilitar esta función.";
  if (!templateDataPreloadedResult) {
    return (
      <TemplateForm blocked={!hasSubscription} blockMessage={blockedMsg} />
    );
  } else {
    return (
      <TemplateForm
        initialValues={templateDataPreloadedResult}
        blocked={!hasSubscription}
        blockMessage={blockedMsg}
      />
    );
  }
};
