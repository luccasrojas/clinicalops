import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfileDialog } from "./user-profile-dialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

interface ClinicalNote {
  id: string;
  title: string;
  created_at: string;
  transcription: string;
  structured_note: string | null;
  audio_duration: number | null;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  isActive?: boolean;
  note?: ClinicalNote;
}

interface ChatSidebarProps {
  onSessionSelect: (session: ChatSession | null) => void;
  activeSessionId: string | null;
}

export const ChatSidebar = ({
  onSessionSelect,
  activeSessionId,
}: ChatSidebarProps) => {
  const { user } = useUser();

  // Directly fetch notes from Convex
  const notesData = useQuery(
    api.clinical_notes.getByUserId,
    user ? { userId: user.id } : "skip"
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Transform Convex notes → ChatSessions
  useMemo(() => {
    if (!notesData) return;

    const noteSessions: ChatSession[] = notesData.map((note) => ({
      id: note.id,
      title: note.title,
      date: formatDistanceToNow(new Date(note.created_at), {
        addSuffix: true,
        locale: es,
      }),
      isActive: note.id === activeSessionId,
      note: {
        ...note,
        structured_note: note.structured_note ?? null,
        audio_duration: note.audio_duration ?? null,
      },
    }));

    setSessions(noteSessions);
  }, [notesData, activeSessionId]);

  const handleNewSession = () => {
    onSessionSelect(null);
    setSessions((prev) =>
      prev.map((session) => ({ ...session, isActive: false }))
    );
  };

  const handleSessionClick = (session: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === session.id,
      }))
    );
    onSessionSelect(session);
  };

  const loading = notesData === undefined;

  return (
    <div className="chat-sidebar w-64 h-full p-4 flex flex-col">
      <div className="mb-6">
        <Button
          onClick={handleNewSession}
          className="w-full justify-start hover:bg-primary/90 transition-colors"
        >
          <span className="material-icons mr-2">add</span>
          New Note
        </Button>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-muted mb-3">
          Notas recientes
        </h3>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Cargando notas...
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  No hay notas clínicas aún
                </div>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    session.isActive
                      ? "bg-accent/10 border border-accent/20"
                      : "hover:bg-medical-hover"
                  }`}
                >
                  <div className="font-medium text-sm truncate">
                    {session.title} {`isActive ${session.isActive}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {session.date}
                  </div>
                  {session.note?.audio_duration && (
                    <div className="text-xs text-accent mt-1">
                      {Math.floor(session.note.audio_duration / 60)}:
                      {(session.note.audio_duration % 60)
                        .toString()
                        .padStart(2, "0")}{" "}
                      min
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-6 pt-4 border-t border-medical-border">
        <UserProfileDialog />
      </div>
    </div>
  );
};
