"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Preloaded, usePreloadedQuery } from "convex/react";
import React from "react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { formatDurationV2 } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarNotesClient = (props: {
  preloadedMeetings: Preloaded<typeof api.meetings.getMany>;
}) => {
  const pathname = usePathname();

  const meetingsData = usePreloadedQuery(props.preloadedMeetings);

  if (!meetingsData) {
    return <div>Cargando notas...</div>;
  }

  if (meetingsData.items.length === 0) {
    // return <div>No hay notas recientes.</div>;
    return <div>No hay notas recientes.</div>;
  }

  return (
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-muted mb-3">Notas recientes</h3>
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-y-2">
          {meetingsData.items.map((meeting) => (
            // maybe should be neutral
            // or a reexport of the reusable components that basically show the meeting ui
            // that's probably fine... perhaps next js has a way to handle multiple link paths
            // will probably be a different link but...
            <Link
              href={`/dashboard/sessions/${meeting.nanoId}`}
              key={`noteLink-${meeting.nanoId}`}
            >
              <button
                key={meeting.nanoId}
                className={`cursor-pointer w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                  pathname === `/dashboard/simulations/${meeting.nanoId}` ||
                  pathname === `/dashboard/sessions/${meeting.nanoId}`
                    ? "bg-accent/10 border border-accent/20"
                    : "hover:bg-medical-hover"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm line-clamp-1">
                    {meeting.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(meeting.endedAt ?? meeting.createdAt, {
                      locale: es,
                    })}
                  </div>
                  {meeting.duration && (
                    <div className="text-xs text-accent mt-1">
                      {formatDurationV2(meeting.duration)}
                    </div>
                  )}
                </div>
              </button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SidebarNotesClient;
