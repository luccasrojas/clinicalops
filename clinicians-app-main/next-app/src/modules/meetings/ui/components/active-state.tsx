import { EmptyState } from "@/components/empty-state";

import { VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  meetingId: string;
}

const ActiveState = ({ meetingId }: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center">
      <EmptyState
        image="/upcoming.svg"
        title="La simulación está activa"
        description="La simulación terminará cuando todos los participantes abandonen la llamada."
      />
      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
        <Button variant={"accent"} asChild className="w-full lg:w-auto">
          <Link href={`/call/${meetingId}`}>
            <VideoIcon />
            {"Unirse a la llamada"}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ActiveState;
