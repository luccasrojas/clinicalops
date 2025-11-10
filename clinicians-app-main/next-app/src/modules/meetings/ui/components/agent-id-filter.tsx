import { useState } from "react";
import { useQuery } from "convex/react";

import { CommandSelect } from "@/components/command-select";

import GeneratedAvatar from "@/components/generated-avatar";

import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

import { api } from "../../../../../convex/_generated/api";

export const AgentIdFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();

  const [agentSearch, setAgentSearch] = useState("");
  const agentsData = useQuery(api.agents.getMany, {
    pageSize: 100, // fetch up to 100 agents for the dropdown
    search: agentSearch,
  });

  //   if (agentsData === undefined) return null;
  //   if (!agentsData) return null;

  return (
    <CommandSelect
      className="h-9"
      placeholder="Paciente virtual (IA)"
      options={(agentsData?.items ?? []).map((agent) => ({
        id: agent.nanoId,
        value: agent.nanoId,
        children: (
          <div className="flex items-center gap-x-2">
            <GeneratedAvatar
              seed={agent.name}
              variant="botttsNeutral"
              className="size-4"
            />
            {agent.name}
          </div>
        ),
      }))}
      onSelect={(value) => setFilters({ agentNanoId: value })}
      onSearch={setAgentSearch}
      value={filters.agentNanoId ?? ""}
    />
  );
};
