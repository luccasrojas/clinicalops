"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { columns, Payment } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useAgentsFilters } from "../../hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";

// const mockData: Payment[] = [
//   {
//     id: "234234",
//     amount: 100,
//     status: "pending",
//     email: "m@example.com",
//   },
// ];

export const AgentsView = () => {
  const router = useRouter();

  const [filters, setFilters] = useAgentsFilters();

  const agentsData = useQuery(api.agents.getMany, {
    // pageSize: 3,
    ...filters,
  });

  if (!agentsData)
    return (
      <LoadingState
        title="Cargando pacientes virtuales (IA)"
        description="Esto puede tardar unos segundos..."
      />
    );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={agentsData.items}
        columns={columns}
        onRowClick={(row) => router.push(`/dashboard/agents/${row.nanoId}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={agentsData.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {agentsData.items.length === 0 && (
        <EmptyState
          title="Crea tu primer paciente virtual"
          description="Crea un paciente virtual para empezar a simular consultas. Cada paciente virtual impulsado por IA seguirá tus instrucciones y responderá a tus preguntas en tiempo real durante las simulaciones."
        />
      )}
    </div>
  );
};
