import { getClerkAuthenticatedTokenServer } from "@/lib/utils-clerk-server";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import MeetingsView from "@/modules/meetings/ui/views/meetings-view";
import { api } from "@convexdev/_generated/api";
import { preloadQuery } from "convex/nextjs";
import React from "react";

const Page = async () => {
  const token = await getClerkAuthenticatedTokenServer();

  if (!token) {
    //   return <div>Please log in to view your meetings.</div>;
    // Spanish
    return <div>{"Por favor, inicie sesión para ver sus reuniones."}</div>;
  }

  const preloadedMeetings = await preloadQuery(
    api.meetings.getMany,
    {
      page: 1,
      pageSize: 10,
      simulation: true,
    },
    {
      token,
    }
  );

  return (
    <>
      <MeetingsListHeader />
      <MeetingsView isSimulation={true} preloadedMeetings={preloadedMeetings} />
    </>
  );
};

export default Page;
