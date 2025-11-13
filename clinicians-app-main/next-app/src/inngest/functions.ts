import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { clerkClient } from "@clerk/nextjs/server";
import JSONL from "jsonl-parse-stringify";
import { api } from "../../convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";

import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { summarizerPrompt1 } from "@/prompts/summarizer-1";
import { clinicalNotePrompt1 } from "@/prompts/clinical-note-1";
import { FASTAPI_APP_URL, GCS_BUCKET_NAME } from "@shared/constants";
import { parsePrartisTranscriptToJSONL } from "@/lib/parse-transcript";
import { gcpStorageClient } from "@/gcs/client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

// const summarizer = createAgent({
//   name: "summarizer",
//   system: summarizerPrompt1,
//   model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! }),
// });

const clinicalNoteMaker_DeprecatedTest = createAgent({
  name: "clinical-note-maker",
  system: clinicalNotePrompt1,
  model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! }),
});

const bucketName = GCS_BUCKET_NAME;
const bucket = gcpStorageClient.bucket(bucketName);

export const simulationsProcessing = inngest.createFunction(
  { id: "simulations/processing" },
  { event: "simulations/processing" },
  async ({ event, step }) => {
    // const response = await step.fetch(event.data.trascriptUrl);

    // const transcript = await step.run("parse-transcript", async () => {
    //   const text = await response.text();
    //   return JSONL.parse<StreamTranscriptItem>(text);
    // });

    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

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
      ).then((res) =>
        res.filter((u): u is NonNullable<typeof u> => u !== null)
      );

      console.log("User speakers:", userSpeakers);

      const agentSpeakers = await fetchQuery(api.webhooks.agents.getManyByIds, {
        nanoIds: speakerIds,
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      });

      console.log("Agent speakers:", agentSpeakers);

      // probably need to normalize the data a bit so that it has the same type

      // at least ids. relevant id with user is id, relevant id with agent is nanoId
      // so we need to map agent nanoId to id for consistency

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
          imageUrl: "<default>",
          persona_type: "ai" as const, // probably should say ai to avoid confusion, agents in this app can be ai or human
        })),
      ];

      console.log("Normalized speakers:", speakers);

      return transcript.map((transcriptItem) => {
        const speaker = speakers.find(
          (speaker) => speaker.speakerNormalizedId === transcriptItem.speaker_id
        );

        console.log("Matching speaker for transcript item:", {
          transcriptItem,
          speaker,
        });

        if (!speaker) {
          return {
            ...transcriptItem,
            user: {
              name: "Unknown",
            },
          };
        }

        // simple for now
        return {
          ...transcriptItem,
          user: {
            name: speaker.name,
            // imageUrl: speaker.imageUrl,
            // persona_type: speaker.persona_type,
          },
        };
      });
    });

    // const { output: summarizerOutput } = await summarizer.run(
    //   "Resume el siguiente transcript: " +
    //     JSON.stringify(transcriptWithSpeakers)
    // );

    // TODO: Update to use the clinical note maker that calls the FastAPI endpoint

    // const { output: clinicalNoteOutput } =
    //   await clinicalNoteMaker_DeprecatedTest.run(
    //     "Genera una nota clínica basada en el siguiente transcript: " +
    //       `${JSON.stringify(transcriptWithSpeakers)}`
    //   );

    await step.run("save-meeting-LLM-outputs", async () => {
      await fetchMutation(api.webhooks.meetings.update, {
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
        // be careful about misspelling because it can be anything
        // same with event.data.transcriptUrl
        nanoId: event.data.meetingNanoId,
        status: "completed",
        // summary: (summarizerOutput[0] as TextMessage).content as string,
        summary: "Resumen no generado en esta versión.",
        // clinicalNote: (clinicalNoteOutput[0] as TextMessage).content as string,
        // clinicalNote: (clinicalNoteOutput[0] as TextMessage).content as string,
      });
    });
  }
);

// maybe this will be needed?

// const speakers = await step.run("fetch-speakers", async () => {
//   return fetch("/api/speakers?ids=" + speakerIds.join(",")).then((res) =>
//     res.json()
//   );
// });

// return transcript.map((item) => {
//   const speaker = speakers.find((s) => s.id === item.speaker_id);
//   return {
//     ...item,
//     speaker_name: speaker ? speaker.name : "Unknown",
//   };
// });
