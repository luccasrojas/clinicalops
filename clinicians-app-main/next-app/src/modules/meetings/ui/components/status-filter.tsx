import {
  CircleXIcon,
  CircleCheckIcon,
  ClockArrowUpIcon,
  VideoIcon,
  LoaderIcon,
} from "lucide-react";

import { CommandSelect } from "@/components/command-select";

import { MeetingStatusEnum } from "../../types";

import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { MeetingStatus } from "../../../../../convex/enums";

const statusSpanishMap = {
  upcoming: "Próxima",
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
  processing: "Procesando",
};

const options = [
  {
    id: MeetingStatusEnum.Upcoming,
    value: MeetingStatusEnum.Upcoming,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ClockArrowUpIcon />
        {/* {MeetingStatusEnum.Upcoming} */}
        {statusSpanishMap[MeetingStatusEnum.Upcoming]}
      </div>
    ),
  },
  {
    id: MeetingStatusEnum.Completed,
    value: MeetingStatusEnum.Completed,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleCheckIcon />
        {statusSpanishMap[MeetingStatusEnum.Completed]}
      </div>
    ),
  },
  {
    id: MeetingStatusEnum.Active,
    value: MeetingStatusEnum.Active,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <VideoIcon />
        {statusSpanishMap[MeetingStatusEnum.Active]}
      </div>
    ),
  },
  {
    id: MeetingStatusEnum.Cancelled,
    value: MeetingStatusEnum.Cancelled,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleXIcon />
        {statusSpanishMap[MeetingStatusEnum.Cancelled]}
      </div>
    ),
  },
  {
    id: MeetingStatusEnum.Processing,
    value: MeetingStatusEnum.Processing,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <LoaderIcon
        // className="animate-spin"
        />
        {statusSpanishMap[MeetingStatusEnum.Processing]}
      </div>
    ),
  },
];

export const StatusFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();

  return (
    <CommandSelect
      placeholder="Estado"
      className="h-9"
      options={options}
      onSelect={(value) => setFilters({ status: value as MeetingStatusEnum })}
      value={filters.status ?? ""}
      // not used here
      //   onSearch={}
    />
  );
};
