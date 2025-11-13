import {
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { streamVideo } from "@/lib/stream-video";
import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { inngest } from "@/inngest/client";
import { STREAM_IO_CALL_TYPE } from "@/constants";
import { polar } from "@/lib/polar";

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKEy = req.headers.get("x-api-key");

  if (!signature || !apiKEy) {
    console.log("Missing signature or API key");
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    console.log("Invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;

    const meetingNanoId = event.call.custom?.meetingNanoId;

    if (!meetingNanoId) {
      console.log("Missing meetingId in call custom data");
      // log payload for debugging
      console.log("Payload:", JSON.stringify(payload, null, 2));
      return NextResponse.json(
        { error: "Missing meetingNanoId in call custom data" },
        { status: 400 }
      );
    }

    const existingMeeting = await fetchQuery(api.webhooks.meetings.getOne, {
      nanoId: meetingNanoId,
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
    });

    if (!existingMeeting) {
      console.log("Meeting not found", meetingNanoId);
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Meeting can't be completed, active, or cancelled status
    if (
      existingMeeting.status === "completed" ||
      existingMeeting.status === "active" ||
      existingMeeting.status === "cancelled" ||
      existingMeeting.status === "processing"
    ) {
      console.log("Meeting already active or completed", meetingNanoId);
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await fetchMutation(api.webhooks.meetings.update, {
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      nanoId: meetingNanoId,
      status: "active",
      startedAt: Date.now(),
    });

    const existingAgent = await fetchQuery(api.webhooks.agents.getOne, {
      nanoId: existingMeeting.agentNanoId,
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
    });

    if (!existingAgent) {
      console.log("Agent not found", existingMeeting.agentNanoId);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const call = streamVideo.video.call(STREAM_IO_CALL_TYPE, meetingNanoId);

    console.log("agentUserId for call", {
      agentUserId: existingAgent.nanoId,
    });

    // Check the artificial boolean property. If true, connect to OpenAI
    if (existingAgent.artificial == false) {
      console.log(
        "Agent is not artificial, skipping OpenAI connection",
        // but it's an abstract representation of a real patient, so it's still associated to the call but won't connect to OpenAI
        existingAgent.nanoId
      );
      return NextResponse.json({ status: "ok" });
    }

    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: process.env.OPENAI_API_KEY!,
      agentUserId: existingAgent.nanoId,
    });

    console.log("Connected to OpenAI Realtime API");
    // console.log("realtimeClient", realtimeClient);

    const resultRealtimeClientUpdateSessionResult =
      realtimeClient.updateSession({
        instructions: existingAgent.instructions,
        turn_detection: { type: "server_vad" },
        // input_audio_transcription: { model: "whisper-1" },
      });
    console.log(
      "resultRealtimeClientUpdateSessionResult",
      resultRealtimeClientUpdateSessionResult
    );

    // Send a message to trigger a generation
    realtimeClient.sendUserMessageContent([
      { type: "input_text", text: "¿Cómo te sientes, cuál es el problema?" },
    ]);
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const _meetingNanoId = event.call_cid.split(":")[1];

    if (!_meetingNanoId) {
      console.log("Missing meetingId in call custom data");
      return NextResponse.json(
        { error: "Missing meetingId in call custom data" },
        { status: 400 }
      );
    }

    const call = streamVideo.video.call(STREAM_IO_CALL_TYPE, _meetingNanoId);
    await call.end();
  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const meetingNanoId = event.call.custom?.meetingNanoId;

    if (!meetingNanoId) {
      console.log("Missing meetingId in call custom data call ended event");
      return NextResponse.json(
        { error: "Missing meetingId in call custom data call ended event" },
        { status: 400 }
      );
    }

    await fetchMutation(api.webhooks.meetings.update, {
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      nanoId: meetingNanoId,
      status: "processing",
      endedAt: Date.now(),
    });
  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingNanoId = event.call_cid.split(":")[1];

    if (!meetingNanoId) {
      console.log(
        "Missing meetingId in call custom data transcription ready event"
      );
      return NextResponse.json(
        {
          error:
            "Missing meetingId in call custom data transcription ready event",
        },
        { status: 400 }
      );
    }

    const meeting = await fetchQuery(api.webhooks.meetings.getOne, {
      nanoId: meetingNanoId,
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
    });

    if (!meeting) {
      console.log(
        "Meeting not found in transcription_ready event",
        meetingNanoId
      );
      return NextResponse.json(
        { error: "Meeting not found in transcription_ready event" },
        { status: 404 }
      );
    }

    const isSimulation = meeting.simulation == true;

    if (isSimulation) {
      await fetchMutation(api.webhooks.meetings.update, {
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
        nanoId: meetingNanoId,
        status: meeting.status,
        transcriptUrl: event.call_transcription.url,
      });

      // should probably check updated meeting has transcript url in case mutation fails or something
      // Get existing meeting I need userId
      const userId = meeting.userId;
      await polar.events.ingest({
        events: [
          {
            name: "api_call",
            // Replace with your logic to get the customer id
            externalCustomerId: userId,
            metadata: {
              route: "/api/inngest/simulations/processing",
              method: "PUT",
            },
          },
        ],
      });

      // TODO: Call Inngest background job to summarize the transcript
      await inngest.send({
        name: "simulations/processing",
        data: {
          // be super careful about
          // spelling!!!
          meetingNanoId: meetingNanoId,
          transcriptUrl: event.call_transcription.url,
        },
      });
    }
  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingNanoId = event.call_cid.split(":")[1];

    if (!meetingNanoId) {
      console.log(
        "Missing meetingId in call custom data recording ready event"
      );
      return NextResponse.json(
        {
          error: "Missing meetingId in call custom data recording ready event",
        },
        { status: 400 }
      );
    }

    const meeting = await fetchQuery(api.webhooks.meetings.getOne, {
      nanoId: meetingNanoId,
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
    });

    if (!meeting) {
      console.log("Meeting not found in recording_ready event", meetingNanoId);
      return NextResponse.json(
        { error: "Meeting not found in recording_ready event" },
        { status: 404 }
      );
    }

    await fetchMutation(api.webhooks.meetings.update, {
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      nanoId: meetingNanoId,
      status: meeting.status,
      recordingUrl: event.call_recording.url,
    });

    const userId = meeting.userId;
    await polar.events.ingest({
      events: [
        {
          name: "api_call",
          // Replace with your logic to get the customer id
          externalCustomerId: userId,
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
        // be super careful about
        // spelling!!!
        meetingNanoId: meetingNanoId,
        recordingUrl: event.call_recording.url,
        userId: userId,
      },
    });
  }

  return NextResponse.json({ status: "ok" });
}

// GET HELLO WORLD TEST
export async function GET() {
  return NextResponse.json({ status: "ok", message: "Hello World!" });
}
