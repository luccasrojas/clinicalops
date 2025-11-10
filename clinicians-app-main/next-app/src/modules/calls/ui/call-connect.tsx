"use client";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { CallUI, CallUIPRARTIS } from "./call-ui";

interface UseStreamClientProps {
  userId: string;
  userName: string;
  userImage: string;
}

export function useStreamClient({
  userId,
  userName,
  userImage,
}: UseStreamClientProps) {
  const {
    data: token,
    //  isLoading
  } = useStreamToken();
  const [client, setClient] = useState<StreamVideoClient>();

  //   https://chatgpt.com/c/68e519dc-0ac4-8320-bcde-6b111d574b1d?model=gpt-5
  //   Client helper (the “mutation”)
  //   async function generateStreamToken(): Promise<string> {
  //     console.log("Generating token...");
  //     const res = await fetch("/api/stream/generate-token", {
  //       method: "POST",
  //     });
  //     if (!res.ok) throw new Error("Token request failed");
  //     const { token } = await res.json();
  //     return token;
  //   }

  useEffect(() => {
    if (!token) return; // wait until token is ready

    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: {
        id: userId,
        name: userName,
        image: userImage,
      },
      tokenProvider: async () => {
        console.log("Stream requesting token...");
        return token;
      },
    });

    setClient(_client);

    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, [userId, userName, userImage, token]);

  return client;
}

interface UseStreamCallProps {
  client?: StreamVideoClient;
  meetingId: string;
}

export function useStreamCall({ client, meetingId }: UseStreamCallProps) {
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    if (!client) return;

    const _call = client.call(STREAM_IO_CALL_TYPE, meetingId);
    _call.camera.disable();
    _call.microphone.disable();
    setCall(_call);

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
        _call.endCall();
        setCall(undefined);
      }
    };
  }, [client, meetingId]);

  return call;
}

interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
}

import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { STREAM_IO_CALL_TYPE } from "@/constants";

export function useStreamToken() {
  return useTanstackQuery({
    queryKey: ["streamToken"],
    queryFn: async () => {
      const res = await fetch("/api/stream/generate-token", { method: "POST" });
      if (!res.ok) throw new Error("Token request failed");
      const { token } = await res.json();
      return token;
    },
    staleTime: 1000 * 60 * 55, // 55 minutes (tokens last ~1h)
    gcTime: 1000 * 60 * 60, // keep cache for 1h
    retry: 1,
  });
}

export const CallConnect = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: Props) => {
  const client = useStreamClient({ userId, userName, userImage });
  const call = useStreamCall({ client, meetingId });

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-accent to-primary">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};

export const CallConnectPRARTIS = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: Props) => {
  const client = useStreamClient({ userId, userName, userImage });
  const call = useStreamCall({ client, meetingId });

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center ">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUIPRARTIS meetingName={meetingName} meetingId={meetingId} />
      </StreamCall>
    </StreamVideo>
  );
};
