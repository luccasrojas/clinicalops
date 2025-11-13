"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ErrorState, ErrorStatePRARTIS } from "@/components/error-state";
import { CallProvider, CallProviderPRARTIS } from "./call-provider";
import { LoaderIcon } from "lucide-react";

interface Props {
  meetingId: string;
}

const CallView = ({ meetingId }: Props) => {
  const meetingData = useQuery(api.meetings.getOne, { nanoId: meetingId });

  if (meetingData === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-accent to-primary">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }
  if (meetingData === null) {
    return <p className="text-white">no data</p>;
  }

  if (meetingData?.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="La simulación ha finalizado"
          description="Ya no puedes unirte a esta simulación"
        />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={meetingData.name} />;
};

export default CallView;

export const CallViewPRARTIS = ({ meetingId }: Props) => {
  const meetingData = useQuery(api.meetings.getOne, { nanoId: meetingId });

  if (meetingData === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-accent" />
      </div>
    );
  }
  if (meetingData === null) {
    return <p className="text-white">no data</p>;
  }

  if (meetingData?.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorStatePRARTIS
          title="La sesión ha finalizado"
          description="Ya no puedes continuar grabando esta sesión"
          actionText="Ver resultados"
          actionHref={`/dashboard/sessions/${meetingId}`}
        />
      </div>
    );
  }

  return (
    <CallProviderPRARTIS meetingId={meetingId} meetingName={meetingData.name} />
  );
};
