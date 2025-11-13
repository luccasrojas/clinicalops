// app/dashboard/_components/SidebarNotesServer.tsx
// import { HydrationBoundary, dehydrate } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import SidebarNotesClient from "./sidebar-notes-client";
import { auth } from "@clerk/nextjs/server";
// import { getClerkAuthenticatedTokenServer } from "@/lib/utils-clerk";

export default async function SidebarNotesServer({
  authToken: token,
}: {
  authToken: string | null;
}) {
  //   const token = await getClerkAuthenticatedTokenServer();

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
    },
    {
      token,
    }
  );

  return <SidebarNotesClient preloadedMeetings={preloadedMeetings} />;
}
// // app/dashboard/_components/SidebarNotesServer.tsx
// // import { HydrationBoundary, dehydrate } from "convex/react";
// import { api } from "@/../convex/_generated/api";
// import { preloadQuery } from "convex/nextjs";
// import SidebarNotesClient from "./SidebarNotesClient";

// export default async function SidebarNotesServer() {
//   const preloaded = await preloadQuery(api.meetings.getMany, {
//     page: 1,
//     pageSize: 10,
//   });

//   return (
//     <HydrationBoundary state={dehydrate(preloaded)}>
//       <SidebarNotesClient />
//     </HydrationBoundary>
//   );
// }
