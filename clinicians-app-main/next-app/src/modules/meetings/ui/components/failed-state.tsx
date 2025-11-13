"use client";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

interface Props {
  onRetry?: () => void;
  isRetrying?: boolean;
  isSimulation?: boolean;
  recordingUrl?: string;
}

const FailedState = ({
  onRetry,
  isRetrying = false,
  isSimulation = true,
  recordingUrl,
}: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center">
      <div className="p-3 bg-red-100 rounded-full">
        <AlertTriangleIcon className="size-8 text-red-600" />
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col gap-y-6 max-w-md mx-auto text-center">
          <h6 className="text-lg font-medium">{`La ${
            isSimulation ? "simulación" : "sesión"
          } ha fallado`}</h6>
          {/* <p className="text-sm text-muted-foreground">{`Ocurrió un error al procesar la ${
            isSimulation ? "simulación" : "sesión"
          }. Puedes intentarlo nuevamente.`}</p> */}
          <p className="text-sm text-muted-foreground">{`Ocurrió un error al procesar la ${
            isSimulation ? "simulación" : "sesión"
          }.`}</p>
        </div>
      </div>
      {/* (
        <EmptyState
          image="/failed.svg"
          title={`La ${isSimulation ? "simulación" : "sesión"} ha fallado`}
          description={`Ocurrió un error al procesar la ${
            isSimulation ? "simulación" : "sesión"
          }. Puedes intentarlo nuevamente.`}
        />
      ) */}
      {onRetry && (
        <Button
          variant="secondaryExcellent"
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-x-2"
        >
          <RefreshCwIcon className={isRetrying ? "animate-spin" : ""} />
          {isRetrying ? "Reintentando..." : "Reintentar"}
        </Button>
      )}
      {recordingUrl && (
        <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full max-w-lg">
          <p className="justify">
            {
              "Por favor, verifica que la grabación de abajo está bien y puedes escuchar el audio claramente. Si la grabación está bien, puedes descargarla e intentarlo nuevamente creando una nueva nota."
            }
          </p>
          <audio
            src={recordingUrl}
            // rounded-lg not everything gotta be rounded my goodness
            className="w-full"
            controls
            // style={{ border: "2px solid red" }}
          />
          {/* The alternative should be that they record with an app in their phone and upload an audio with the option in the new note page */}
          {/* Use proper language!!!! */}
          {/* Si la grabacion no esta bien (ej. no se escucha nada)... */}
          <p className="justify">
            {
              "Si la grabación no está bien (ej. no se escucha nada), por favor graba una nueva nota utilizando una aplicación diferente de grabación y utiliza, en su lugar, la opción de subir un audio existente en la página de nueva nota."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FailedState;
