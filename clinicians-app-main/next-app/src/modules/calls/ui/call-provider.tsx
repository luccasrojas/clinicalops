"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2Icon, LoaderIcon } from "lucide-react";
import { CallConnect, CallConnectPRARTIS } from "./call-connect";
import { generateAvatarUri } from "@/lib/avatar";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
  const data = useAuth();

  const userData = useUser();

  if (!data.isLoaded || !userData.isLoaded)
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-accent to-primary">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );

  if (!data.isSignedIn || !userData.user) return <p>Acceso Denegado</p>;

  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingName}
      userId={userData.user.id}
      userName={userData.user.firstName || "Desconocido"}
      userImage={
        userData.user.imageUrl ??
        generateAvatarUri({
          seed: userData.user.fullName || "Desconocido",
          variant: "initials",
        })
      }
    />
  );
};

export const CallProviderPRARTIS = ({ meetingId, meetingName }: Props) => {
  const data = useAuth();

  const userData = useUser();

  if (!data.isLoaded || !userData.isLoaded)
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-accent" />
      </div>
    );

  if (!data.isSignedIn || !userData.user) return <p>Acceso Denegado</p>;

  return (
    <CallConnectPRARTIS
      meetingId={meetingId}
      meetingName={meetingName}
      userId={userData.user.id}
      userName={userData.user.firstName || "Desconocido"}
      userImage={
        userData.user.imageUrl ??
        generateAvatarUri({
          seed: userData.user.fullName || "Desconocido",
          variant: "initials",
        })
      }
    />
  );
};
