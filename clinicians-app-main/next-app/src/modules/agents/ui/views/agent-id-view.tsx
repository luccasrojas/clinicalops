"use client";
import { useQuery } from "convex/react";
import React, { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { AgentIdViewHeader } from "../components/agent-id-view-header";
import GeneratedAvatar from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateAgentDialog } from "../components/update-agent-dialog";

interface Props {
  agentId: string;
}

const AgentIdView = ({ agentId }: Props) => {
  const router = useRouter();

  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

  const agentData = useQuery(api.agents.getOne, {
    nanoId: agentId,
  });

  const { mutate: removeAgent, pending } = useApiMutation(api.agents.remove);

  const onRemoveAgentSuccess = async () => {
    // TODO: Invalidate free tier usage
    router.push("/dashboard/agents");
  };

  const onRemoveAgentError = (error: Error) => {
    toast.error(error.message || "Error al eliminar el paciente virtual");
    console.error(error);
  };

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "¿Estás seguro de que deseas eliminar este paciente virtual (IA)? Esta acción no se puede deshacer.",
    `La siguiente acción eliminará ${agentData?.meetingCount} ${
      agentData?.meetingCount === 1
        ? "simulación asociada"
        : "simulaciones asociadas"
    }.`
  );

  const handleRemoveAgent = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    removeAgent({ nanoId: agentId })
      .then(onRemoveAgentSuccess)
      .catch(onRemoveAgentError);
  };

  if (agentData === undefined) return <AgentIdViewLoading />;
  if (agentData === null) return null;

  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={agentData}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={agentData.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
            <div className="flex items-center gap-x-3">
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={agentData.name}
                className="size-10"
              />
              <h2 className="text-2xl font-medium">{agentData.name}</h2>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-x-2 [&>svg]:size-4"
            >
              <VideoIcon className="text-blue-700" />
              {agentData.meetingCount}{" "}
              {agentData.meetingCount === 1 ? "simulación" : "simulaciones"}
            </Badge>
            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instrucciones</p>
              <p className="text-neutral-800">{agentData.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentIdView;

const AgentIdViewLoading = () => {
  return (
    <LoadingState
      title="Cargando paciente virtual (IA)"
      description="Esto puede tardar unos segundos..."
    />
  );
};

export const AgentIdViewError = () => {
  return (
    <ErrorState
      title="Error al cargar el paciente virtual (IA)"
      description="Intenta recargar la página o vuelve a la lista de pacientes virtuales (IA). Si el problema persiste, contacta con soporte."
    />
  );
};
