import Link from "next/link";
import Image from "next/image";
import {
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

import { formatDuration, intervalToDuration } from "date-fns";
import CustomSpeakerLayout from "./components/custom-speaker-layout-v2";
import { LocalSpeakingVisualizer } from "./components/local-speaking-visualizer";
import { VoiceVisualizer } from "./components/voice-visualizer";
import { VoiceFeedback } from "./components/voice-feedback";

interface Props {
  onLeave: () => void;
  meetingName: string;
}

export const CallActivePRARTIS = ({ onLeave, meetingName }: Props) => {
  const callStateHooks = useCallStateHooks();
  const callState = callStateHooks.useCallState();

  const startedAt = callState.session?.started_at
    ? new Date(callState.session.started_at)
    : null;
  // const startedAt = callState.createdAt; // for testing

  const [elapsed, setElapsed] = useState<number>(0); // seconds

  // 1️⃣ update elapsed every second if we have a start time
  useEffect(() => {
    if (!startedAt) return;

    const tick = () => {
      const diff = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setElapsed(diff);
    };

    tick(); // initial
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // 2️⃣ helper to format nicely (mm:ss or hh:mm:ss)
  const formatElapsed = (seconds: number) => {
    const dur = intervalToDuration({ start: 0, end: seconds * 1000 });
    const { hours = 0, minutes = 0, seconds: secs = 0 } = dur;
    const parts = [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ].filter(Boolean);
    return parts.join(":");
  };

  const isRecording = !!startedAt;

  return (
    <div>
      <div
        className="flex flex-col items-center justify-center flex-1 p-8"
        // style={{ border: "2px solid red" }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Grabación clínica</h2>
          <p className="text-muted-foreground">{meetingName}</p>
        </div>

        <button
          className="recording-button cursor-pointer relative"
          onClick={onLeave}
        >
          <span
            className="material-icons text-white text-3xl absolute"
            // style={{ border: "2px solid white" }}
          >
            stop
          </span>
          <div
            className="absolute"
            // style={{ border: "2px solid green" }}
          >
            <VoiceFeedback accentColor="250,143,56" />
          </div>
        </button>

        {isRecording && (
          <div className="text-center mt-8">
            <div className="text-2xl font-mono font-bold text-accent mb-2">
              {formatElapsed(elapsed)}
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                Grabación activa
              </span>
            </div>
          </div>
        )}

        {!isRecording && (
          <div className="text-sm text-muted-foreground mt-4">
            Esperando inicio de la grabación...
          </div>
        )}
      </div>
      {/* <SpeakerLayout /> */}

      {/* <div
        className="flex  items-center justify-center"
        style={{ border: "2px solid green" }}
      >
        <VoiceFeedback accentColor="250,143,56" />
      </div> */}
    </div>
  );
};

export const CallActive = ({ onLeave, meetingName }: Props) => {
  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
      <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit"
        >
          <Image src="/logo.jpg" width={22} height={22} alt="Logo" />
        </Link>
        <h4 className="text-base">{meetingName}</h4>
      </div>
      <SpeakerLayout />
      <div className="bg-[#101213] rounded-full px-4">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};
