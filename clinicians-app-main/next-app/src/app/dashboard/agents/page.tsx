import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { AgentsView } from "@/modules/agents/ui/views/agents-view";
import React from "react";

const Page = () => {
  return (
    <>
      <AgentsListHeader />
      <AgentsView />
    </>
  );
};

export default Page;
