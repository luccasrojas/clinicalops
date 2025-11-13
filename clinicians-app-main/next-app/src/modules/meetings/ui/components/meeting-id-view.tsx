"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { MeetingIdViewHeader } from "./meeting-id-view-header";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "./update-meeting-dialog";
import { useState } from "react";
import UpcomingState from "./upcoming-state";
import ActiveState from "./active-state";
import CancelledState from "./cancelled-state";
import ProcessingState from "./processing-state";
import CompletedState from "./completed-state";
import FailedState from "./failed-state";

interface Props {
  meetingId: string;
  isSimulation?: boolean;
}
const MeetingIdView = ({ meetingId, isSimulation = true }: Props) => {
  const router = useRouter();

  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const meetingData = useQuery(api.meetings.getOne, {
    nanoId: meetingId,
  });

  const { mutate: removeMeeting, pending } = useApiMutation(
    api.meetings.remove
  );

  const onRemoveMeetingSuccess = async () => {
    // TODO: Invalidate free tier usage
    router.push(`/dashboard/${isSimulation ? "simulations" : "sessions"}`);
  };

  //   const onRemoveMeetingError = (error: Error) => {
  //     toast.error(error.message || "Error al eliminar la simulación");
  //     console.error(error);
  //   };

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    `¿Estás seguro de que deseas eliminar esta ${
      isSimulation ? "simulación" : "sesión"
    }? Esta acción no se puede deshacer.`,
    `La siguiente acción eliminará la ${
      isSimulation ? "simulación" : "sesión"
    }.`
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    removeMeeting({ nanoId: meetingId })
      .then(onRemoveMeetingSuccess)
      //   .catch(onRemoveMeetingError);
      .catch((error: Error) => {
        toast.error(error.message || "Error al eliminar la simulación");
        console.error(error);
      });
  };

  if (meetingData === undefined)
    return <MeetingIdViewLoading isSimulation={isSimulation} />;
  if (meetingData === null) return null;

  const isActive = meetingData.status === "active";
  const isUpcoming = meetingData.status === "upcoming";
  const isCompleted = meetingData.status === "completed";
  const isCancelled = meetingData.status === "cancelled";
  const isProcessing = meetingData.status === "processing";
  const isFailed = meetingData.status === "failed";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={meetingData}
        isSimulation={isSimulation}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingData.nanoId}
          meetingName={meetingData.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
          isSimulation={isSimulation}
          status={meetingData.status}
        />
        {isCancelled && <CancelledState />}
        {isCompleted && <CompletedState data={meetingData} />}
        {isProcessing && (
          <ProcessingState
            isSimulation={isSimulation}
            statusProcessingData={meetingData.statusProcessingData}
          />
        )}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingData.nanoId}
            // onCancelMeeting={() => {}}
            isCancelling={false}
            isSimulation={isSimulation}
          />
        )}
        {isActive && <ActiveState meetingId={meetingData.nanoId} />}
        {isFailed && (
          <FailedState
            isSimulation={isSimulation}
            recordingUrl={meetingData.recordingUrl}
          />
        )}
      </div>
    </>
  );
};

export default MeetingIdView;

const MeetingIdViewLoading = ({
  isSimulation = true,
}: {
  isSimulation?: boolean;
}) => {
  return (
    <LoadingState
      title={`Cargando ${isSimulation ? "simulación" : "sesión"}`}
      description="Esto puede tardar unos segundos..."
    />
  );
};

export const MeetingIdViewError = ({
  isSimulation = true,
}: {
  isSimulation?: boolean;
}) => {
  return (
    <ErrorState
      title={`Error al cargar la ${isSimulation ? "simulación" : "sesión"}`}
      description="Ha ocurrido un error inesperado."
    />
  );
};
