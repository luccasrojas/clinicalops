"use client";

import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const ProcessingState = ({
  isSimulation = true,
  statusProcessingData,
}: {
  isSimulation?: boolean;
  statusProcessingData?: {
    statusMessageShort: string;
    statusMessageLong: string;
    progressFraction: number;
    progressStep: number;
    totalSteps: number;
    completedStepsList: string[];
  };
}) => {
  const progress = statusProcessingData?.progressFraction
    ? Math.min(100, Math.max(0, statusProcessingData.progressFraction * 100))
    : undefined;

  return (
    <div className="bg-white rounded-lg px-4 py-8 flex flex-col gap-y-8 items-center w-full max-w-md mx-auto">
      <EmptyState
        image="/processing.svg"
        title={`La ${isSimulation ? "simulación" : "sesión"} ha terminado`}
        description={`La ${
          isSimulation ? "simulación" : "sesión"
        } está siendo procesada. Esto puede tardar unos minutos.`}
      />

      {statusProcessingData && (
        <div className="w-full text-center flex flex-col gap-y-3">
          <motion.div
            key={statusProcessingData.statusMessageShort}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            {statusProcessingData.statusMessageShort}
          </motion.div>

          <Progress
            variant={"success"}
            value={progress}
            className="h-3 rounded-full"
          />

          <div className="text-xs text-muted-foreground mt-1">
            Paso {statusProcessingData.progressStep} de{" "}
            {statusProcessingData.totalSteps}
          </div>

          {statusProcessingData.completedStepsList?.length > 0 && (
            <div className="mt-2 text-[11px] text-muted-foreground/70 italic">
              Completado: {statusProcessingData.completedStepsList.join(" → ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessingState;
