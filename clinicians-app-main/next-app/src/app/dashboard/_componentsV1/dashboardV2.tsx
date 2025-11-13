import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "./chat-sidebar";
import { SettingsSheet } from "./settings-sheet";
import { NoteViewer } from "./note-viewer";
import { AudioRecorder } from "./audio-recorder";
import { ConversationBar } from "./conversation-bar";
import { MeetingsListHeaderPRARTIS } from "@/modules/meetings/ui/components/meetings-list-header";
// import { useNavigate } from "react-router-dom";
interface ChatSession {
  id: string;
  title: string;
  date: string;
  isActive?: boolean;
  note?: {
    id: string;
    title: string;
    created_at: string;
    transcription: string;
    structured_note: string | null;
    audio_duration: number | null;
  };
}
const DashboardV2 = () => {
  const router = useRouter();

  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const handleTextMessage = async (message: string) => {
    console.log("Text message sent:", message);
    // TODO: Implement text message handling
    // This could integrate with OpenAI API or other conversational AI
  };
  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
    console.log("Voice toggled:", !isVoiceActive);
    // TODO: Implement voice recording/conversation logic
  };
  return (
    <div className="h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 relative pb-24">
          {/* Added padding bottom for conversation bar */}
          {/* {activeSession?.note ? (
            <NoteViewer note={activeSession.note} />
          ) : (
            <AudioRecorder />
          )} */}
          {false ? (
            // yeah we'll get rid of this
            <NoteViewer
              note={{
                audio_duration: 12500,
                created_at: "2025-09-29T19:47:51.794Z",
                id: "dfsdf",
                structured_note: "this is a structured note",
                title:
                  "This is a test title a very long test title a very long test title",
                transcription: "This is a test transcription whatever that is",
              }}
            />
          ) : (
            // <AudioRecorder />
            <MeetingsListHeaderPRARTIS />
          )}
        </main>
      </div>
    </div>
  );
};
export default DashboardV2;
