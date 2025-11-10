import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// import { useToast } from "@/hooks/use-toast";
interface ConversationBarProps {
  onTextMessage: (message: string) => void;
  onVoiceToggle: () => void;
  isVoiceActive: boolean;
  disabled?: boolean;
}
export const ConversationBar = ({
  onTextMessage,
  onVoiceToggle,
  isVoiceActive,
  disabled = false,
}: ConversationBarProps) => {
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  //   const { toast } = useToast();

  const handleSendText = async () => {
    if (!textInput.trim() || isLoading) return;
    try {
      setIsLoading(true);
      await onTextMessage(textInput.trim());
      setTextInput("");
      //   toast({
      //     title: "Mensaje enviado",
      //     description: "Procesando tu consulta...",
      //   });
      toast("Mensaje enviado. Procesando tu consulta...");
    } catch (error) {
      console.error("Error sending text message:", error);
      //   toast({
      //     title: "Error",
      //     description: "No se pudo enviar el mensaje",
      //     variant: "destructive",
      //   });
      toast(
        "No se pudo enviar el mensaje",
        {
          style: {
            background: "red",
            color: "white",
          },
        }
        // check docs
        //     {
        //     variant: "destructive",
        //   }
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };
  const handleVoiceClick = () => {
    try {
      onVoiceToggle();
    } catch (error) {
      console.error("Error toggling voice:", error);
      //   toast({
      //     title: "Error de voz",
      //     description: "No se pudo activar el micrófono",
      //     variant: "destructive",
      //   });
      toast("No se pudo activar el micrófono", {
        style: {
          background: "red",
          color: "white",
        },
      });
    }
  };
  return (
    <div className="fixed bottom-4 left-80 right-0 bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="flex-1 relative">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Pregunta lo que quieras..."
            disabled={disabled || isLoading}
            className="w-full min-h-[24px] max-h-32 resize-none rounded-xl border border-medical-border bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent disabled:opacity-50"
            rows={1}
            style={{
              height: "auto",
              minHeight: "48px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleVoiceClick}
              disabled={disabled}
              className={`h-12 w-12 p-0 rounded-full transition-all duration-300 relative overflow-hidden ${
                isVoiceActive
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg animate-pulse"
                  : "bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-600 border-2 border-orange-300"
              }`}
            >
              {isVoiceActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300/50 to-orange-500/50 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-white/10"></div>
                </>
              )}
              <div
                className={`relative z-10 w-3 h-3 rounded-full transition-all duration-300 ${
                  isVoiceActive ? "bg-white/90 animate-pulse" : "bg-orange-500"
                }`}
              ></div>
            </Button>

            {textInput.trim() && (
              <Button
                size="sm"
                onClick={handleSendText}
                disabled={disabled || isLoading || !textInput.trim()}
                className="h-8 w-8 p-0 rounded-lg bg-medical-primary hover:bg-medical-primary/90 text-white"
              >
                <span className="material-icons text-sm">
                  {isLoading ? "hourglass_empty" : "send"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
