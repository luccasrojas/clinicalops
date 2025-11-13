import Link from "next/link";

import { Button } from "@/components/ui/button";
import MeetingIdView from "@/modules/meetings/ui/components/meeting-id-view";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const CallEnded = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-accent to-primary">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">
              {"Has terminado la simulación"}
            </h6>
            <p className="text-sm">{"El resumen aparecerá en unos minutos."}</p>
          </div>
          <Button asChild variant="accent">
            <Link href="/dashboard/simulations">Volver a simulaciones</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CallEndedPRARTIS = ({ meetingId }: { meetingId: string }) => {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    if (seconds <= 0) {
      router.push(`/dashboard/sessions/${meetingId}`);
      return;
    }

    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, router, meetingId]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">{"Has terminado la sesión"}</h6>
            <p className="text-sm">
              {"La nota clínica aparecerá en unos minutos. Redirigiendo en"}{" "}
              {seconds}...
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => router.push(`/dashboard/sessions/${meetingId}`)}
          >
            {"Ir ahora"}
          </Button>
        </div>
      </div>
    </div>
  );
};
