import { FASTAPI_APP_URL, GCS_BUCKET_NAME } from "@shared/constants";
import { inngest } from "@/inngest/client";
import { parsePrartisTranscriptToJSONL } from "@/lib/parse-transcript";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convexdev/_generated/api";
import { gcpStorageClient } from "@/gcs/client";

const bucketName = GCS_BUCKET_NAME;
const bucket = gcpStorageClient.bucket(bucketName);

const TRANSCRIBE_STEP_NAME = "transcribe";
const TRANSCRIPT_TO_JSONL_STEP_NAME = "transcript-to-jsonl";
const UPLOAD_JSONL_TO_GCS_STEP_NAME = "upload-jsonl-to-gcs";
const FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME = "fetch-clinical-note-example";
const GENERATE_CLINICAL_NOTE_STEP_NAME = "generate-clinical-note";
const SAVE_MEETING_LLM_OUTPUTS_STEP_NAME = "save-meeting-LLM-outputs";

export const sessionsProcessing = inngest.createFunction(
  { id: "sessions/processing" },
  { event: "sessions/processing" },
  async ({ event, step }) => {
    type EventType = {
      meetingNanoId: string;
      recordingUrl: string;
      userId: string;
    };

    const { meetingNanoId, recordingUrl, userId } = event.data as EventType;
    const fastApiUrl = FASTAPI_APP_URL;

    const statusProgressDataDefaults = {
      statusMessageShort: "Starting processing",
      statusMessageLong: "The processing has started.",
      progressFraction: 0,
      progressStep: 0,
      totalSteps: 5, // total number of steps in the processing pipeline
      completedStepsList: [] as string[],
    };

    const transcript = await step.run(
      TRANSCRIBE_STEP_NAME,
      withStepErrorHandling(
        TRANSCRIBE_STEP_NAME,
        getTranscribeInngestStep({ recordingUrl, fastApiUrl }),
        meetingNanoId,
        statusProgressDataDefaults
      )
    );

    // TODO: Save transcript output to convex database too
    const transcriptJsonL = await step.run(
      TRANSCRIPT_TO_JSONL_STEP_NAME,
      withStepErrorHandling(
        TRANSCRIPT_TO_JSONL_STEP_NAME,
        getTranscriptToJSONLInngestStep(transcript),
        meetingNanoId,
        {
          ...statusProgressDataDefaults,
          // need to insert current progressStep and completedStepsList
          progressStep: 1,
          completedStepsList: [stepNameToSpanishMap[TRANSCRIBE_STEP_NAME]],
        }
      )
    );

    const transcriptSignedGcsUrl = await step.run(
      UPLOAD_JSONL_TO_GCS_STEP_NAME,
      withStepErrorHandling(
        UPLOAD_JSONL_TO_GCS_STEP_NAME,
        getUploadJSONLToGCSInngestStep({ meetingNanoId, transcriptJsonL }),
        meetingNanoId,
        {
          ...statusProgressDataDefaults,
          // need to insert current progressStep and completedStepsList
          progressStep: 2,
          completedStepsList: [
            stepNameToSpanishMap[TRANSCRIBE_STEP_NAME],
            stepNameToSpanishMap[TRANSCRIPT_TO_JSONL_STEP_NAME],
          ],
        }
      )
    );

    // const { output: summarizerOutput } = await summarizer.run(
    //   "Resume el siguiente transcript: " + transcript
    // );

    // Retrieve clinical note example (may be null)
    const clinicalNoteExample = await step.run(
      FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME,
      withStepErrorHandling(
        FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME,
        getFetchClinicalNoteExampleInngestStep(userId),
        meetingNanoId,
        {
          ...statusProgressDataDefaults,
          // need to insert current progressStep and completedStepsList
          progressStep: 3,
          completedStepsList: [
            stepNameToSpanishMap[TRANSCRIBE_STEP_NAME],
            stepNameToSpanishMap[TRANSCRIPT_TO_JSONL_STEP_NAME],
            stepNameToSpanishMap[UPLOAD_JSONL_TO_GCS_STEP_NAME],
          ],
        }
      )
    );

    const clinicalNoteOutputStr = await step.run(
      GENERATE_CLINICAL_NOTE_STEP_NAME,
      withStepErrorHandling(
        GENERATE_CLINICAL_NOTE_STEP_NAME,
        getGenerateClinicalNoteInngestStep({
          fastApiUrl,
          transcript,
          clinicalNoteExample,
        }),
        meetingNanoId,
        {
          ...statusProgressDataDefaults,
          progressStep: 4,
          completedStepsList: [
            stepNameToSpanishMap[TRANSCRIBE_STEP_NAME],
            stepNameToSpanishMap[TRANSCRIPT_TO_JSONL_STEP_NAME],
            stepNameToSpanishMap[UPLOAD_JSONL_TO_GCS_STEP_NAME],
            stepNameToSpanishMap[FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME],
          ],
        }
      )
    );

    await step.run(
      SAVE_MEETING_LLM_OUTPUTS_STEP_NAME,
      withStepErrorHandling(
        SAVE_MEETING_LLM_OUTPUTS_STEP_NAME,
        getSaveMeetingLLMOutputsInngestStep({
          meetingNanoId,
          transcriptSignedGcsUrl,
          clinicalNoteOutputStr,
        }),
        meetingNanoId,
        {
          ...statusProgressDataDefaults,
          progressStep: 5,
          completedStepsList: [
            stepNameToSpanishMap[TRANSCRIBE_STEP_NAME],
            stepNameToSpanishMap[TRANSCRIPT_TO_JSONL_STEP_NAME],
            stepNameToSpanishMap[UPLOAD_JSONL_TO_GCS_STEP_NAME],
            stepNameToSpanishMap[FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME],
            stepNameToSpanishMap[GENERATE_CLINICAL_NOTE_STEP_NAME],
          ],
        }
      )
    );
  }
);

const getTranscribeInngestStep = ({
  fastApiUrl,
  recordingUrl,
}: {
  fastApiUrl: string;
  recordingUrl: string;
}) => {
  return async () => {
    const res = await fetch(`${fastApiUrl}/api/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: recordingUrl,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to transcribe audio. Status: ${res.status}, Message: ${errorText}`
      );
    }

    const payload = await res.json();
    return payload.transcription;
  };
};

const getTranscriptToJSONLInngestStep = (transcript: string) => {
  return async () => {
    const parsed = parsePrartisTranscriptToJSONL(transcript);
    return parsed;
  };
};

const getUploadJSONLToGCSInngestStep = ({
  meetingNanoId,
  transcriptJsonL,
}: {
  meetingNanoId: string;
  transcriptJsonL: string;
}) => {
  return async () => {
    const gcsFile = bucket.file(`transcripts/${meetingNanoId}.jsonl`);
    await gcsFile.save(transcriptJsonL, {
      contentType: "application/jsonl",
      resumable: false,
    });
    const [fileUrl] = await gcsFile.getSignedUrl({
      version: "v4",
      action: "read",
      // max allowed expiration is 7 days
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return fileUrl;
  };
};

const getFetchClinicalNoteExampleInngestStep = (userId: string) => {
  return async () => {
    const queryResult = await fetchQuery(api.webhooks.templates.getDefault, {
      userId,
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
    });

    return queryResult?.clinicalNoteExampleContent || null;
  };
};

const getGenerateClinicalNoteInngestStep = ({
  fastApiUrl,
  transcript,
  clinicalNoteExample,
}: {
  fastApiUrl: string;
  transcript: string;
  clinicalNoteExample: string | null;
}) => {
  return async () => {
    // call the fastapi endpoint to generate the clinical note
    const res = await fetch(`${fastApiUrl}/api/clinical-note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcription: transcript,
        // only include example if available
        // clinical_note_example: clinicalNoteExample ?? undefined,
        // I dont want falsy values being sent
        // I prefer to explicitly pass nothing
        ...(clinicalNoteExample
          ? { clinical_note_example: clinicalNoteExample }
          : {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to generate clinical note. Status: ${res.status}, Message: ${errorText}`
      );
    }

    const payload = await res.json();
    console.log("Generated clinical note payload:", payload);

    // return payload["clinical_note"]; // clinical_note is a JSON object in itself
    return payload["clinical_note_str"]; // Inngest serialization messes up the order of keys, so returning the string version
  };
};

const getSaveMeetingLLMOutputsInngestStep = ({
  meetingNanoId,
  transcriptSignedGcsUrl,
  clinicalNoteOutputStr,
}: {
  meetingNanoId: string;
  transcriptSignedGcsUrl: string;
  clinicalNoteOutputStr: string;
}) => {
  return async () => {
    await fetchMutation(api.webhooks.meetings.update, {
      secret: process.env.INTERNAL_WEBHOOK_SECRET!,
      // be careful about misspelling because it can be anything
      // same with event.data.transcriptUrl
      nanoId: meetingNanoId,
      status: "completed",
      // summary: (summarizerOutput[0] as TextMessage).content as string,
      summary: "Resumen no generado en esta versión.",
      // clinicalNote: (clinicalNoteOutput[0] as TextMessage).content as string,
      // clinicalNote: JSON.stringify(clinicalNoteOutput), // why not...
      structuredClinicalNoteJson: clinicalNoteOutputStr,
      structuredClinicalNoteJsonOriginal: clinicalNoteOutputStr,
      transcriptUrl: transcriptSignedGcsUrl,
    });
  };
};

/**
 * Wraps an Inngest step to handle errors consistently.
 * Automatically sets Convex meeting status to "failed" if the step throws.
 */
function withStepErrorHandling<T>(
  stepName: string,
  stepFn: () => Promise<T>,
  meetingNanoId: string,
  statusProcessingData: {
    statusMessageShort: string;
    statusMessageLong: string;
    progressFraction: number;
    progressStep: number;
    totalSteps: number;
    completedStepsList: string[];
  }
): () => Promise<T> {
  return async () => {
    try {
      // update statusProcessingData to reflect current step
      await fetchMutation(api.webhooks.meetings.update, {
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
        nanoId: meetingNanoId,
        status: "processing",
        statusProcessingData: {
          ...statusProcessingData,
          //   statusMessageShort: `Processing step: ${stepName}`,
          statusMessageShort: `Paso de procesamiento: ${stepNameToSpanishMap[stepName]}`,
          //   statusMessageLong: `The processing step "${stepName}" is currently in progress.`,
          statusMessageLong: `El paso de procesamiento "${stepNameToSpanishMap[stepName]}" está en progreso.`,
          progressStep: statusProcessingData.progressStep + 1,
          progressFraction:
            (statusProcessingData.progressStep + 1) /
            statusProcessingData.totalSteps,
          completedStepsList: [
            ...statusProcessingData.completedStepsList,
            stepNameToSpanishMap[stepName] + "...",
          ],
        },
      });
      return await stepFn();
    } catch (err) {
      console.error(`Step "${stepName}" failed:`, err);
      await fetchMutation(api.webhooks.meetings.update, {
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
        nanoId: meetingNanoId,
        status: "failed",
        // error: `${stepName}: ${err.message ?? "Unknown error"}`,
        statusProcessingData: {
          ...statusProcessingData,
          //   statusMessageShort: `Error in step: ${stepName}`,
          statusMessageShort: `Error en el paso: ${stepNameToSpanishMap[stepName]}`,
          //   statusMessageLong: `The processing step "${stepName}" failed. Please try again later.`,
          statusMessageLong: `El paso de procesamiento "${stepNameToSpanishMap[stepName]}" falló. Por favor, inténtalo de nuevo más tarde.`,
        },
      });
      throw err; // still rethrow so Inngest records failure
    }
  };
}

// I want a stepNameToSpanishMap
const stepNameToSpanishMap: { [key: string]: string } = {
  //   Use the constant strings from above for consistency
  [TRANSCRIBE_STEP_NAME]: "transcripción",
  // [TRANSCRIPT_TO_JSONL_STEP_NAME]: "conversión a JSONL",
  [TRANSCRIPT_TO_JSONL_STEP_NAME]: "post-procesamiento de transcripción",
  //   [UPLOAD_JSONL_TO_GCS_STEP_NAME]: "subida a GCS",
  [UPLOAD_JSONL_TO_GCS_STEP_NAME]: "subida a almacenamiento",
  [FETCH_CLINICAL_NOTE_EXAMPLE_STEP_NAME]:
    "obtención de ejemplo de nota clínica",
  [GENERATE_CLINICAL_NOTE_STEP_NAME]: "generación de nota clínica",
  [SAVE_MEETING_LLM_OUTPUTS_STEP_NAME]: "guardado de resultados LLM",
};
