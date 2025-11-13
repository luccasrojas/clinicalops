import Link from "next/link";
import { LoaderIcon, LogInIcon } from "lucide-react";
import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  VideoPreview,
} from "@stream-io/video-react-sdk";

// import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { generateAvatarUri } from "@/lib/avatar";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

interface Props {
  onJoin: () => void;
}

const DisabledVideoPreview = () => {
  const userData = useUser();

  // if I type like :StreamVideoParticipant it complains
  const participant = {
    name: userData.user?.firstName || "",
    image:
      userData.user?.imageUrl ??
      generateAvatarUri({
        seed: userData.user?.fullName || "",
        variant: "initials",
      }),
  } as StreamVideoParticipant;

  return <DefaultVideoPlaceholder participant={participant} />;
};

const AllowBrowserPermissions = () => {
  return (
    <p className="text-sm">
      {
        "Por favor, permite el acceso a la cámara y al micrófono en tu navegador."
      }
    </p>
  );
};

export const CallLobby = ({ onJoin }: Props) => {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();

  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-accent to-primary">
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">¿Listo para unirte?</h6>
            <p className="text-sm">Configura tu llamada antes de unirte.</p>
          </div>
          <VideoPreview
            DisabledVideoPreview={
              hasBrowserMediaPermission
                ? DisabledVideoPreview
                : AllowBrowserPermissions
            }
          />
          <div className="flex gap-x-2">
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
          </div>
          <div className="flex gap-x-2 justify-between w-full">
            <Button asChild variant="ghost">
              <Link href="/dashboard/simulations">Cancelar</Link>
            </Button>
            <Button onClick={onJoin} variant={"accent"}>
              <LogInIcon />
              Unirse a la llamada
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CallLobbyPRARTIS = ({ onJoin }: Props) => {
  const { useMicrophoneState } = useCallStateHooks();
  const {
    hasBrowserPermission,
    isMute, // <- source of truth for ON/OFF
    microphone, // MicrophoneManager
    isPromptingPermission, // optional: show spinner if you want
  } = useMicrophoneState();

  const [countdown, setCountdown] = useState<number | null>(null);

  // ensure we only auto-enable once per mount
  const didAutoEnableRef = useRef(false);

  // 1) Try enabling immediately if user had it ON before and we have permission.
  useEffect(() => {
    if (didAutoEnableRef.current) return;

    const pref = localStorage.getItem("micPreference"); // "enabled" | "disabled" | null

    if (pref === "enabled" && hasBrowserPermission && isMute) {
      didAutoEnableRef.current = true;
      (async () => {
        try {
          await microphone.enable(); // same API works in lobby
        } catch (err) {
          console.warn("Immediate auto-enable failed:", err);
          // we'll try again on the first gesture below
          didAutoEnableRef.current = false;
        }
      })();
    }
  }, [hasBrowserPermission, isMute, microphone]);

  // 2) Fallback: on the first user gesture, enable if user prefers ON.
  useEffect(() => {
    if (didAutoEnableRef.current) return;

    const handleUserGesture = async () => {
      const pref = localStorage.getItem("micPreference");
      if (pref === "enabled" && hasBrowserPermission && isMute) {
        try {
          await microphone.enable();
        } catch (err) {
          console.warn("Gesture auto-enable failed:", err);
        }
      }
      didAutoEnableRef.current = true;
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };

    window.addEventListener("pointerdown", handleUserGesture, { once: true });
    window.addEventListener("keydown", handleUserGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, [hasBrowserPermission, isMute, microphone]);

  // Persist the user's preference whenever they toggle
  useEffect(() => {
    if (!hasBrowserPermission) return;
    localStorage.setItem("micPreference", isMute ? "disabled" : "enabled");
  }, [hasBrowserPermission, isMute]);

  // Countdown starts when mic is ON (i.e., !isMute) and permission exists
  useEffect(() => {
    if (hasBrowserPermission && !isMute) setCountdown(5);
    else setCountdown(null);
  }, [hasBrowserPermission, isMute]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      onJoin();
      return;
    }
    const t = setTimeout(() => setCountdown((p) => (p ? p - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [countdown, onJoin]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Grabación clínica</h2>
      </div>
      <LoaderIcon className="size-6 animate-spin text-accent" />
      <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">
              {!hasBrowserPermission
                ? "Esperando permisos..."
                : isMute
                ? "Activa el micrófono para comenzar"
                : "Aguarda un momento..."}
            </h6>
            <p className="text-sm">
              {hasBrowserPermission && !isMute
                ? countdown !== null
                  ? `La grabación comenzará en ${countdown} segundo${
                      countdown === 1 ? "" : "s"
                    }...`
                  : "La grabación comenzará en un instante."
                : "Por favor, permite el acceso al micrófono en tu navegador."}
            </p>
          </div>

          <div className="flex gap-x-2">
            <ToggleAudioPreviewButton />
          </div>

          <div className="flex gap-x-2 justify-between w-full">
            <Button asChild variant="ghost">
              <Link href="/dashboard">Cancelar</Link>
            </Button>
            <Button
              onClick={onJoin}
              variant="accent"
              disabled={!hasBrowserPermission || isMute}
            >
              <LogInIcon />
              Comenzar ya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
