import { EmptyState } from "@/components/empty-state";

import { VideoIcon, BanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  meetingId: string;
  onCancelMeeting?: () => void;
  isCancelling: boolean;
  isSimulation?: boolean;
}

const UpcomingState = ({
  meetingId,
  onCancelMeeting,
  isCancelling,
  isSimulation = true,
}: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center">
      <EmptyState
        image="/upcoming.svg"
        title={`La ${isSimulation ? "simulación" : "sesión"} está programada`}
        description={`En el momento en que comiences la ${
          isSimulation ? "simulación" : "sesión"
        }, un resumen estará disponible.`}
      />
      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
        {onCancelMeeting && (
          <Button
            variant="secondary"
            className="w-full lg:w-auto"
            onClick={onCancelMeeting}
            disabled={isCancelling}
          >
            <BanIcon />
            {`Cancelar ${isSimulation ? "simulación" : "sesión"}`}
          </Button>
        )}
        <Button
          disabled={isCancelling}
          variant={"accent"}
          asChild
          className="w-full lg:w-auto"
        >
          <Link
            href={`${isSimulation ? "/call" : "/dashboard/c"}/${meetingId}`}
          >
            <VideoIcon />
            {`Comenzar ${isSimulation ? "simulación" : "sesión"}`}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default UpcomingState;
