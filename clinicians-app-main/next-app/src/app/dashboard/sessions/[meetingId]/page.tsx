import MeetingIdView from "@/modules/meetings/ui/components/meeting-id-view";

interface Props {
  params: Promise<{
    meetingId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { meetingId } = await params;

  return <MeetingIdView meetingId={meetingId} isSimulation={false} />;
};

export default Page;
