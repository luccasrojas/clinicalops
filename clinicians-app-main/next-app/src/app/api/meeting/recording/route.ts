import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convexdev/_generated/api";
import { nanoid } from "nanoid";
import { auth, currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { GCS_BUCKET_NAME } from "@shared/constants";
import { gcpStorageClient } from "../../../../gcs/client";
import { parseBuffer } from "music-metadata";
import { ConvexError } from "convex/values";
import { polar } from "@/lib/polar";

const bucket = gcpStorageClient.bucket(GCS_BUCKET_NAME);

export async function POST(req: NextRequest) {
  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user) return new NextResponse("User not found", { status: 404 });

  const token = await getToken({ template: "convex" });
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  try {
    // console.log("Request body:", await req.json());
    const reqJson = await req.json();
    console.log("Parsed JSON:", reqJson);
    const { objectKey } = reqJson;
    if (!objectKey)
      return NextResponse.json({ error: "Missing objectKey" }, { status: 400 });

    const file = bucket.file(objectKey);
    const [exists] = await file.exists();
    if (!exists)
      return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Download for metadata extraction
    const [buffer] = await file.download();

    // ✅ Extract audio duration
    let durationSeconds: number | null = null;
    try {
      const metadata = await parseBuffer(buffer, undefined, { duration: true });
      durationSeconds = metadata.format.duration ?? null;
    } catch (err) {
      console.warn("Could not parse duration:", err);
    }

    const timestamp = Date.now();

    const createdAgent = await fetchMutation(
      api.agents.create,
      {
        name: "Paciente anónimo",
        instructions:
          "Eres un paciente en una consulta con un doctor. El doctor busca generar una nota clínica.",
        artificial: false,
      },
      { token }
    );

    const createdMeeting = await fetchMutation(
      api.meetings.create,
      {
        agentNanoId: createdAgent.nanoId,
        name: `Sesión del ${new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`,
        simulation: false,
      },
      { token }
    );

    // Signed read URL for playback
    const [fileUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const startedAt = timestamp;
    const endedAt =
      durationSeconds != null ? startedAt + durationSeconds * 1000 : null;

    await fetchMutation(api.webhooks.meetings.update, {
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      nanoId: createdMeeting.nanoId,
      recordingUrl: fileUrl,
      status: "processing",
      startedAt,
      endedAt: endedAt ?? undefined,
    });

    await polar.events.ingest({
      events: [
        {
          name: "api_call",
          // Replace with your logic to get the customer id
          externalCustomerId: user.id,
          metadata: {
            route: "/api/inngest/sessions/processing",
            method: "PUT",
          },
        },
      ],
    });

    await inngest.send({
      name: "sessions/processing",
      data: {
        meetingNanoId: createdMeeting.nanoId,
        recordingUrl: fileUrl,
        userId: user.id,
      },
    });

    return NextResponse.json({
      status: "ok",
      message: "Metadata processed successfully",
      data: {
        fileUrl,
        meetingId: createdMeeting.nanoId,
        agentId: createdAgent.nanoId,
      },
    });
  } catch (error) {
    console.error("Error handling metadata:", error);

    if (error instanceof ConvexError) {
      if (error.data?.code === "FORBIDDEN") {
        return NextResponse.json(
          {
            error: {
              data: error.data,
              message: "Forbidden",
            },
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error handling metadata" },
      { status: 500 }
    );
  }
}
