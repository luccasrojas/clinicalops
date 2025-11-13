import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { convexHttpClientInstance } from "@/lib/convex-http-client";
import { api } from "../../../../../convex/_generated/api";

import { fetchQuery } from "convex/nextjs";
import { STREAM_IO_CALL_TYPE } from "@/constants";

export async function POST(req: Request) {
  const { meetingNanoId, meetingName, agentNanoId } = await req.json();

  // ✅ Authenticate with Clerk
  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user) return new NextResponse("User not found", { status: 404 });

  // ✅ Create Stream call
  const call = await streamVideo.video.call(STREAM_IO_CALL_TYPE, meetingNanoId);

  await call.create({
    data: {
      created_by_id: user.id,
      custom: {
        meetingNanoId: meetingNanoId,
        meetingName: meetingName,
      },
      settings_override: {
        transcription: {
          language: "en",
          mode: "auto-on",
          closed_caption_mode: "auto-on",
        },
        recording: {
          mode: "auto-on",
          quality: "1080p",
        },
      },
    },
  });

  //   const token = await getAuthToken();
  const token = await getToken({ template: "convex" });

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const existingAgent = await fetchQuery(
    api.agents.getOne,
    {
      nanoId: agentNanoId,
    },
    {
      token,
    }
  );

  if (!existingAgent) {
    return new NextResponse("Agent not found", { status: 404 });
  }

  await streamVideo.upsertUsers([
    {
      id: existingAgent.nanoId,
      name: existingAgent.name,
      role: "user",
      image: generateAvatarUri({
        seed: existingAgent.name,
        variant: "bottsNeutral",
      }),
    },
  ]);

  // ✅ Return Stream call info or token
  return NextResponse.json({
    callId: call.id,
    // callUrl: `https://app.stream.video/call/${call.id}`,
  });
}
