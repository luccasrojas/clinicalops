import { CallViewPRARTIS } from "@/modules/calls/ui/call-view";

interface Props {
  params: Promise<{
    meetingId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { meetingId } = await params;

  return <CallViewPRARTIS meetingId={meetingId} />;
};

export default Page;
