// Could be a convex api function but...

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import JSONL from "jsonl-parse-stringify";
import { StreamTranscriptItem } from "@/modules/meetings/types";

// I find it annoying to re declare types
export async function POST(req: Request) {
  const { meetingNanoId } = await req.json();

  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user) return new NextResponse("User not found", { status: 404 });

  const token = await getToken({ template: "convex" });

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const existingMeeting = await fetchQuery(
    api.meetings.getOne,
    {
      nanoId: meetingNanoId,
    },
    {
      token,
    }
  );

  if (!existingMeeting) {
    return new NextResponse("Meeting not found", { status: 404 });
  }

  if (!existingMeeting.transcriptUrl) {
    return new NextResponse("Transcript URL not found", { status: 404 });
  }

  const transcript = await fetch(existingMeeting.transcriptUrl)
    .then((res) => res.text())
    .then((text) => JSONL.parse<StreamTranscriptItem>(text))
    .catch((err) => {
      console.error("Error fetching or parsing transcript:", err);
      return null;
    });

  if (!transcript) {
    return new NextResponse("Error fetching or parsing transcript", {
      status: 500,
    });
  }

  const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

  const _clerkClient = await clerkClient();
  const userSpeakers = await Promise.all(
    speakerIds.map(async (id) => {
      try {
        const user = await _clerkClient.users.getUser(id);
        console.log("Found user in Clerk:", id);
        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          imageUrl: user.imageUrl,
        };
      } catch {
        console.log("User not found in Clerk:", id);
        return null;
      }
    })
  ).then((res) => res.filter((u): u is NonNullable<typeof u> => u !== null));

  // will use webhook because there is no difference
  const agentSpeakers = await fetchQuery(api.webhooks.agents.getManyByIds, {
    nanoIds: speakerIds,
    secret: process.env.INTERNAL_WEBHOOK_SECRET!,
  });

  const speakers = [
    ...userSpeakers.map((user) => ({
      speakerNormalizedId: user.id,
      name: user.fullName || user.email || "Unknown User",
      imageUrl: user.imageUrl,
      persona_type: "human" as const,
    })),
    ...agentSpeakers.map((agent) => ({
      speakerNormalizedId: agent.nanoId,
      name: agent.name,
      imageUrl: null, // undefined or null?
      persona_type: "ai" as const, // probably should say ai to avoid confusion, agents in this app can be ai or human
    })),
  ];

  const transcriptWithSpeakers = transcript.map((transcriptItem) => {
    const speaker = speakers.find(
      (speaker) => speaker.speakerNormalizedId === transcriptItem.speaker_id
    );

    // console.log("Matching speaker for transcript item:", {
    //   transcriptItem,
    //   speaker,
    // });

    if (!speaker) {
      return {
        ...transcriptItem,
        user: {
          // name: "Unknown",
          name: transcriptItem.speaker_id,
        },
      };
    }

    // simple for now
    return {
      ...transcriptItem,
      user: {
        name: speaker.name,
        imageUrl: speaker.imageUrl,
        // persona_type: speaker.persona_type,
      },
    };
  });

  return NextResponse.json({ transcript: transcriptWithSpeakers });

  // console.log("About to redact transcript");
  // // --- 👇 Call PHI redaction layer before returning ---
  // const redactedTranscript = await redactPHIIfNeeded(transcriptWithSpeakers);
  // console.log("Redaction complete");
  // console.log(redactedTranscript.slice(0, 5));

  // return NextResponse.json({ transcript: redactedTranscript });
  // TODO: Consider streaming, although probably overkill
}

// --- 👇 NEW utility ---
async function redactPHIIfNeeded(
  transcript: StreamTranscriptItem[]
): Promise<StreamTranscriptItem[]> {
  try {
    const prompt = `
Eres un asistente médico responsable del cumplimiento de HIPAA.
Tu tarea es revisar la siguiente transcripción y redactar o reemplazar 
cualquier información de salud protegida (PHI), incluyendo nombres, fechas, 
direcciones, números de identificación, hospitales o cualquier otro dato 
que pueda revelar la identidad de una persona. 
Sustituye dichos datos por marcadores genéricos como [PACIENTE], [FECHA], [LUGAR], etc.
No sustituyas SpeakerA and SpeakerB or the speaker IDs.

Devuelve el resultado en formato JSON, manteniendo la misma estructura del input.
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // ⚡ fastest stable Groq model
        temperature: 0,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: JSON.stringify(transcript) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Groq redaction request failed", await res.text());
      // return transcript;
      throw new Error("Redaction request failed");
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content)
      // return transcript;
      throw new Error("Redaction response missing content");

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : transcript;
  } catch (err) {
    console.error("Redaction error:", err);
    // return transcript;
    throw err;
  }
}
