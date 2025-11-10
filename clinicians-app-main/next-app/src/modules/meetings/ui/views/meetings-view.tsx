"use client";

import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import React from "react";
import { api } from "../../../../../convex/_generated/api";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { DataTable } from "@/components/data-table";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { DataPagination } from "../components/data-pagination";
import { MeetingStatusEnum } from "../../types";

interface Props {
  isSimulation?: boolean;
  preloadedMeetings: Preloaded<typeof api.meetings.getMany>;
}

const MeetingsView = ({ isSimulation = true, preloadedMeetings }: Props) => {
  const router = useRouter();
  const [filters, setFilters] = useMeetingsFilters();

  // https://chatgpt.com/c/68f4e72e-caf0-8321-9a33-88edfb988e32
  const meetingsDataPreloadedResult = usePreloadedQuery(preloadedMeetings);
  const meetingsDataLiveResult = useQuery(api.meetings.getMany, {
    // status: "upcoming",
    // ...filters,
    //spread. them one by one
    page: filters.page,
    // expects undefined not null
    status: (filters.status !== "undefined" ? filters.status : undefined) as
      | MeetingStatusEnum
      | undefined,
    agentNanoId: filters.agentNanoId,
    search: filters.search,
    simulation: isSimulation,
  });

  const isInitialPage =
    filters.page === 1 &&
    filters.search === "" &&
    filters.agentNanoId === "" &&
    filters.status == "undefined";

  // const meetingsData =
  //   filters.page === 1 && !filters.search
  //     ? meetingsDataPreloadedResult
  //     : meetingsDataLiveResult;
  const meetingsData = isInitialPage
    ? meetingsDataPreloadedResult
    : meetingsDataLiveResult;

  if (meetingsData === undefined)
    return <MeetingsViewLoading isSimulation={isSimulation} />;
  if (meetingsData === null)
    return <MeetingsViewError isSimulation={isSimulation} />;

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={meetingsData.items}
        columns={columns}
        onRowClick={(row) =>
          router.push(
            `/dashboard/${isSimulation === true ? "simulations" : "sessions"}/${
              row.nanoId
            }`
          )
        }
      />
      <DataPagination
        page={filters.page}
        totalPages={meetingsData.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {meetingsData.items.length === 0 && (
        <EmptyState
          title={`Crea tu primera ${isSimulation ? "simulación" : "sesión"}`}
          description={`${
            isSimulation
              ? "Crea una simulación para empezar a simular consultas. Cada simulación impulsada por IA seguirá tus instrucciones y responderá a tus preguntas en tiempo real durante las simulaciones."
              : "Crea una sesión para empezar a registrar consultas. Cada sesión te permitirá llevar un seguimiento detallado de tus reuniones con pacientes, generar notas clínicas y mejorar la gestión de tu práctica."
          }`}
          //   description="Agenda una simulación para empezar a simular consultas. Cada simulación impulsada por IA seguirá tus instrucciones y responderá a tus preguntas en tiempo real durante las simulaciones."
          //   description="Agenda una simulación."
        />
      )}
    </div>
  );
};

export default MeetingsView;

const MeetingsViewLoading = ({
  isSimulation = true,
}: {
  isSimulation: boolean;
}) => {
  return (
    <LoadingState
      title={`Cargando ${isSimulation ? "simulaciones" : "sesiones"}`}
      description="Esto puede tardar unos segundos..."
    />
  );
};

export const MeetingsViewError = ({
  isSimulation = true,
}: {
  isSimulation?: boolean;
}) => {
  return (
    <ErrorState
      title={`Error al cargar ${isSimulation ? "simulaciones" : "sesiones"}`}
      description="Ha ocurrido un error inesperado."
    />
  );
};

// PRARTIS
// Could be another paradigm
// export const MeetingsViewPRARTIS = () => {
//   return <MeetingsView isSimulation={false} />;
// };
