import AgentIdView from "@/modules/agents/ui/views/agent-id-view";

interface Props {
  params: Promise<{ agentId: string }>;
}

const Page = async ({ params }: Props) => {
  const { agentId } = await params;

  return <AgentIdView agentId={agentId} />;
};

export default Page;
