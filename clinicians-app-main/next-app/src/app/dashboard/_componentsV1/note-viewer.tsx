import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClinicalNote {
  id: string;
  title: string;
  created_at: string;
  transcription: string;
  structured_note: string | null;
  audio_duration: number | null;
}

interface NoteViewerProps {
  note: ClinicalNote;
}

export const NoteViewer = ({ note }: NoteViewerProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">{note.title}</h1>
          {note.audio_duration && (
            <Badge variant="secondary" className="text-accent">
              <span className="material-icons mr-1 text-sm">schedule</span>
              {formatDuration(note.audio_duration)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {format(new Date(note.created_at), "PPpp", { locale: es })}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transcripción */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <span className="material-icons mr-2 text-accent">
                transcription
              </span>
              Transcripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.transcription}
              </p>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Nota Estructurada */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <span className="material-icons mr-2 text-accent">
                description
              </span>
              Nota Clínica Estructurada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {note.structured_note ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {note.structured_note}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-4xl text-muted-foreground mb-2">
                    pending
                  </span>
                  <p className="text-muted-foreground">
                    La nota estructurada está siendo procesada...
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Acciones */}
      <div className="flex items-center justify-end space-x-4">
        <button className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <span className="material-icons text-sm">download</span>
          <span>Exportar</span>
        </button>
        <button className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <span className="material-icons text-sm">edit</span>
          <span>Editar</span>
        </button>
        <button className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <span className="material-icons text-sm">delete</span>
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
};
