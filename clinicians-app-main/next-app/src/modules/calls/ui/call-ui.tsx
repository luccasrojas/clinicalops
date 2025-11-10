import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby, CallLobbyPRARTIS } from "./call-lobby";
import { CallActive, CallActivePRARTIS } from "./call-active";
import { CallEnded, CallEndedPRARTIS } from "./call-ended";

function useCallUI() {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const handleJoin = async () => {
    if (!call) return;
    await call.join();
    setShow("call");
  };

  const handleLeave = () => {
    if (!call) return;
    call.endCall();
    setShow("ended");
  };

  return {
    call,
    show,
    handleJoin,
    handleLeave,
    setShow,
  };
}

interface CallUIProps {
  meetingName: string;
}

export const CallUI = ({ meetingName }: CallUIProps) => {
  const { show, handleJoin, handleLeave } = useCallUI();

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive onLeave={handleLeave} meetingName={meetingName} />
      )}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};

interface CallUIPRARTISProps {
  meetingName: string;
  meetingId: string;
}

export const CallUIPRARTIS = ({
  meetingName,
  meetingId,
}: CallUIPRARTISProps) => {
  const { show, handleJoin, handleLeave } = useCallUI();

  // Can probably call handleJoin in a use effect here...
  // actually, do it inside the lobby state
  // there you can check if the user has given the right permissions to the browser for recording

  // for testing ui
  // return <CallActivePRARTIS onLeave={handleLeave} meetingName={meetingName} />;
  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobbyPRARTIS onJoin={handleJoin} />}
      {show === "call" && (
        <CallActivePRARTIS onLeave={handleLeave} meetingName={meetingName} />
      )}
      {show === "ended" && <CallEndedPRARTIS meetingId={meetingId} />}
    </StreamTheme>
  );
};
