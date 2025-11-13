"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import DashboardV1 from "./_componentsV1/dashboardV1";
import DashboardV2 from "./_componentsV1/dashboardV2";

export default function Home() {
  // return <DashboardV1 />;
  return <DashboardV2 />;

  // const users = useQuery(api.users.getMany);
  // const addUser = useMutation(api.users.add);

  // return (
  //   <>
  //     <div className="flex flex-col items-center justify-center min-h-svh">
  //       <p>Just testing I guess</p>
  //       <UserButton />
  //       <OrganizationSwitcher
  //         // it's the default now but just to be explicit
  //         hidePersonal={true}
  //       />
  //       <Button onClick={() => addUser()}>Add</Button>
  //       <div className="max-w-sm w-full mx-auto">
  //         {JSON.stringify(users, null, 2)}
  //       </div>
  //     </div>
  //   </>
  // );
}
