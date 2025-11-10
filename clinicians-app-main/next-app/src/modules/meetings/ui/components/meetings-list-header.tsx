"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE } from "../../../../../convex/constants";
import {
  NewMeetingDialog,
  NewMeetingDialogPRARTIS,
} from "./new-meeting-dialog";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { StatusFilter } from "./status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { MeetingStatusEnum } from "../../types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";

interface MeetingsListHeaderProps {
  isSimulation?: boolean;
}

export const MeetingsListHeader = ({
  isSimulation = true,
}: MeetingsListHeaderProps) => {
  const [filters, setFilters] = useMeetingsFilters();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { title, newButton, clearFilters } = useStrings(isSimulation);

  // const isAnyFilterModified =
  //   !!filters.search || !!filters.status || !!filters.agentNanoId;
  const isAnyFilterModified =
    !!filters.search || filters.status !== "undefined" || !!filters.agentNanoId;

  const onClearFilters = () => {
    setFilters({
      search: "",
      status: null,
      agentNanoId: "",
      page: DEFAULT_PAGE,
    });
  };

  // Work around to force on clear filters if there is no query on path name
  // dont like it
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname.includes("?")) {
      onClearFilters();
    }
  }, [pathname]);

  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">{title}</h5>
          {isSimulation == true && (
            <Button variant={"accent"} onClick={() => setIsDialogOpen(true)}>
              <PlusIcon />
              {newButton}
            </Button>
          )}
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <MeetingsSearchFilter />
            <StatusFilter />
            {isSimulation == true && <AgentIdFilter />}
            {isAnyFilterModified && (
              <Button variant={"outline"} onClick={onClearFilters}>
                <XCircleIcon className="size-4" />
                {clearFilters}
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};

// We follow the same pattern so much that we'll still code this up here
// In an abstract way, it's still the "header" actions all we care about for PRARTIS
export const MeetingsListHeaderPRARTIS = () => {
  return (
    <>
      <NewMeetingDialogPRARTIS />
    </>
  );
};

function useStrings(isSimulation: boolean) {
  const strings = isSimulation
    ? {
        title: "Simulaciones",
        newButton: "Nueva simulación",
        clearFilters: "Limpiar filtros",
      }
    : {
        title: "Sesiones",
        newButton: "Nueva sesión",
        clearFilters: "Limpiar filtros",
      };

  return strings;
}
