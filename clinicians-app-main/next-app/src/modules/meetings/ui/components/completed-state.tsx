import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingGetOne } from "../../types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import GeneratedAvatar from "@/components/generated-avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

import Markdown from "react-markdown";
import { es } from "date-fns/locale";
import MarkdownContent from "@/components/markdown-content";
import { Transcript } from "./transcript";
import JsonFormEditorDemo, {
  JsonFormEditor,
  JsonValue,
} from "@/components/json-form-editor";
import { useMutation } from "convex/react";
import { api } from "@convexdev/_generated/api";
import { useDebouncedCallback } from "use-debounce";
import TiptapEditor, {
  TiptapEditorDemo,
  TiptapEditorPRARTIS,
  TiptapEditorTest,
} from "@/components/tiptap/editor";
import {
  TiptapEditorV2PRARTIS,
  TiptapEditorV2Test,
} from "@/components/tiptap/editor-v2";

interface Props {
  data: MeetingGetOne;
}

const CompletedState = ({ data }: Props) => {
  const tabsTriggerClassName =
    "text-muted-foreground rounded-none bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-accent data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground";
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="clinical-note">
        <div className="bg-white rounded-sm border px-3">
          <ScrollArea>
            {/* rounded-none */}
            <TabsList className="p-0 bg-background justify-start rounded-none h-13">
              <TabsTrigger
                value="clinical-note"
                className={tabsTriggerClassName}
              >
                <BookOpenTextIcon />
                {"Nota clínica"}
              </TabsTrigger>
              {/* <TabsTrigger value="summary" className={tabsTriggerClassName}>
                <BookOpenTextIcon />
                {"Resumen"}
              </TabsTrigger> */}
              <TabsTrigger value="transcript" className={tabsTriggerClassName}>
                <FileTextIcon />
                {"Transcripción"}
              </TabsTrigger>
              <TabsTrigger value="recording" className={tabsTriggerClassName}>
                <FileVideoIcon />
                {"Grabación"}
              </TabsTrigger>
              {/* <TabsTrigger value="chat" className={tabsTriggerClassName}>
                <SparklesIcon />
                {"Chat"}
              </TabsTrigger> */}
            </TabsList>
            <ScrollBar orientation="horizontal"></ScrollBar>
          </ScrollArea>
        </div>
        <TabsContent value="clinical-note">
          <ClinicalNoteContent data={data} />
        </TabsContent>
        <TabsContent value="summary">
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
              <h2 className="text-2xl font-medium capitalize">{data.name}</h2>
              <div className="flex gap-x-2 items-center">
                <Link
                  href={`/dashboard/agents/${data.agent.nanoId}`}
                  className="flex items-center gap-x-2 underline underline-offset-4 capitalize"
                >
                  <GeneratedAvatar
                    variant="botttsNeutral"
                    seed={data.agent.name}
                    className="size-5"
                  />
                  {data.agent.name}
                </Link>{" "}
                <p>
                  {data.startedAt
                    ? format(data.startedAt, "PPP", { locale: es })
                    : ""}
                </p>
              </div>
              <div className="flex gap-x-2 items-center">
                <SparklesIcon className="size-4" />
                <p>General summary</p>
              </div>

              <Badge
                variant="outline"
                className="flex items-center gap-x-2 [&>svg]:size-4"
              >
                <ClockFadingIcon className="text-blue-700" />
                {data.duration ? formatDuration(data.duration) : "No duration"}
              </Badge>
              <div>
                <Markdown
                  components={{
                    h1: (props) => (
                      <h1 className="text-2xl font-medium mb-6" {...props} />
                    ),
                    h2: (props) => (
                      <h2 className="text-xl font-medium mb-6" {...props} />
                    ),
                    h3: (props) => (
                      <h3 className="text-lg font-medium mb-6" {...props} />
                    ),
                    h4: (props) => (
                      <h4 className="text-base font-medium mb-6" {...props} />
                    ),
                    p: (props) => (
                      <p className="mb-6 leading-relaxed" {...props} />
                    ),
                    ul: (props) => (
                      <ul className="list-disc list-inside mb-6" {...props} />
                    ),
                    ol: (props) => (
                      <ol
                        className="list-decimal list-inside mb-6"
                        {...props}
                      />
                    ),
                    li: (props) => <li className="mb-1" {...props} />,
                    strong: (props) => (
                      <strong className="font-semibold" {...props} />
                    ),
                    code: (props) => (
                      <code
                        className="bg-gray-100 px-1 py-0.5 rounded"
                        {...props}
                      />
                    ),
                    blockquote: (props) => (
                      <blockquote
                        className="border-l-4 pl-4 italic my-4"
                        {...props}
                      />
                    ),
                  }}
                >
                  {data.summary}
                </Markdown>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="transcript">
          <Transcript meetingId={data.nanoId} />
        </TabsContent>
        <TabsContent value="recording">
          <div className="bg-white rounded-lg border px-4 py-5">
            <audio
              src={data.recordingUrl!}
              // rounded-lg not everything gotta be rounded my goodness
              className="w-full"
              controls
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompletedState;

export const ClinicalNoteContent = ({ data: meetingData }: Props) => {
  const updateStructuredClinicalNote = useMutation(
    api.meetings.updateStructuredClinicalNote
  );

  const handleClinicalNoteChange = useDebouncedCallback(
    (structuredClinicalNoteJson: JsonValue) => {
      const current = meetingData.structuredClinicalNoteJson
        ? JSON.parse(meetingData.structuredClinicalNoteJson)
        : {};

      // Only update if the content actually changed
      if (
        JSON.stringify(current) !== JSON.stringify(structuredClinicalNoteJson)
      ) {
        console.log("Updating clinical note…");
        updateStructuredClinicalNote({
          nanoId: meetingData.nanoId,
          structuredClinicalNoteJson: JSON.stringify(
            structuredClinicalNoteJson
          ),
        });
      }
    },
    1000
  );

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
        <h2 className="text-2xl font-medium not-capitalize">
          {meetingData.name}
        </h2>

        <div className="flex gap-x-2 items-center">
          <SparklesIcon className="size-4" />
          <p>Nota clínica</p>
        </div>

        <Badge
          variant="outline"
          className="flex items-center gap-x-2 [&>svg]:size-4"
        >
          <ClockFadingIcon className="text-blue-700" />
          {meetingData.duration
            ? formatDuration(meetingData.duration)
            : "No duration"}
        </Badge>

        <div>
          {false && (
            <MarkdownContent
              content={
                meetingData.structuredClinicalNoteJson ??
                "No clinical note available."
              }
            />
          )}
          {/* <JsonFormEditorDemo /> */}
          {/* <JsonBlockNoteEditorDemo /> */}
          {/* <TiptapEditor
            value={JSON.parse(meetingData.structuredClinicalNoteJson ?? "{}")}
            onChange={(data) => {
              handleClinicalNoteChange(data);
            }}
          /> */}
          {/* <JsonTiptapDemo /> */}
          <div className="clinical-note-tiptap-editor text-muted">
            <TiptapEditorPRARTIS
              value={JSON.parse(meetingData.structuredClinicalNoteJson ?? "{}")}
              onChange={(data) => {
                handleClinicalNoteChange(data);
              }}
            />
            {/* <TiptapEditorV2Test
              value={JSON.parse(meetingData.structuredClinicalNoteJson ?? "{}")}
              onChange={(data) => {
                handleClinicalNoteChange(data);
              }}
            /> */}
            {/* <TiptapEditorDemo /> */}
          </div>
          {/* <JsonFormEditor
            initialData={JSON.parse(
              meetingData.structuredClinicalNoteJson ?? "{}"
            )}
            onChange={(data) => {
              handleClinicalNoteChange(data);
            }}
          /> */}
        </div>
      </div>
    </div>
  );
};
