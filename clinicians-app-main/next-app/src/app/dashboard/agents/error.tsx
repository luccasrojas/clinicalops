"use client";

import { ErrorState } from "@/components/error-state";

const ErrorPage = () => {
  return (
    <ErrorState
      title="Error cargando pacientes virtuales (IA)"
      description="Por favor, intenta más tarde"
    />
  );
};

export default ErrorPage;
