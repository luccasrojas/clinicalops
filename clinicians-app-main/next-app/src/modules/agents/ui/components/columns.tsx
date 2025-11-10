"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AgentGetMany } from "../../types";
import { CornerDownRightIcon, VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import GeneratedAvatar from "@/components/generated-avatar";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<AgentGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Nombre de paciente virtual",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <GeneratedAvatar seed={row.original.name} variant="botttsNeutral" />
          <span className="font-semibold not-capitalize">
            {row.original.name}
          </span>
        </div>
        <div className="flex items-center gap-x-2">
          <CornerDownRightIcon className="size-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground max-w-[200px] truncate not-capitalize">
            {row.original.instructions}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "meetingCount",
    header: "Número de simulaciones",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex items-center gap-x-2 [&>svg]:size-4"
      >
        <VideoIcon className="text-blue-700" />
        {/* {0} */}
        {/* {JSON.stringify(row.original)} */}
        {row.original.meetingCount}{" "}
        {row.original.meetingCount === 1 ? "simulación" : "simulaciones"}
      </Badge>
    ),
  },
];
