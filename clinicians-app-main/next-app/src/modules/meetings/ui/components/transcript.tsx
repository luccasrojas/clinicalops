import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUri } from "@/lib/avatar";

import { format } from "date-fns";
import Highlighter from "react-highlight-words";

interface TranscriptItem {
  user: {
    name: string;
    imageUrl?: string;
  };
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
}

async function fetchTranscript(
  meetingNanoId: string
): Promise<TranscriptItem[]> {
  const res = await fetch("/api/transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingNanoId }),
  });
  if (!res.ok) throw new Error("Failed to load transcript");
  const data = await res.json();
  return data.transcript;
}

export function useTranscript(meetingNanoId?: string) {
  return useQuery({
    queryKey: ["transcript", meetingNanoId],
    queryFn: () => fetchTranscript(meetingNanoId!),
    enabled: !!meetingNanoId, // only run if id is defined
    staleTime: 1000 * 60 * 5, // optional: 5 minutes
    gcTime: 1000 * 60 * 10, // optional: keep cache for 10 minutes
  });
}

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const { data, isLoading, error, refetch } = useTranscript(meetingId);

  const [searchQuery, setSearchQuery] = useState("");
  const filteredData = (data || []).filter((item) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <p>{"Cargando transcripción..."}</p>;
  if (error)
    return (
      <p>
        {"Error cargando transcripción: "}: {(error as Error).message}
      </p>
    );

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">{"Transcripción"}</p>
      <div className="relative">
        <Input
          // placeholder="Search Transcript"
          placeholder="Buscar en la transcripción"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-y-4">
          {filteredData.map((item) => {
            return (
              <div
                key={item.start_ts}
                className="flex flex-col gap-y-2 hover:bg-medical-border p-4 rounded-md border"
              >
                <div className="flex gap-x-2 items-center">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={
                        item.user.imageUrl ??
                        generateAvatarUri({
                          seed: item.user.name,
                          variant: "thumbs",
                        })
                      }
                      alt="User Avatar"
                    />
                  </Avatar>
                  <p className="text-sm font-medium">{item.user.name}</p>
                  <p>
                    {/* Will sessions ever be longer than an hour? */}
                    {format(
                      new Date(0, 0, 0, 0, 0, 0, item.start_ts),
                      "HH:mm:ss"
                    )}
                  </p>
                </div>
                <Highlighter
                  className="text-sm text-neutral-700"
                  highlightClassName="bg-yellow-200"
                  searchWords={[searchQuery]}
                  autoEscape={true}
                  textToHighlight={item.text}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
