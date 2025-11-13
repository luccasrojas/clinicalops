"use client";

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { SpeakerLayout } from "@stream-io/video-react-sdk";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface CustomSpeakerLayoutProps {
  participantsBarPosition?: "top" | "bottom" | "left" | "right" | null;
}

/**
 * ChatGPT-style visual feedback for the local participant.
 * A soft circular pulse that responds to your voice.
 */
export const CustomSpeakerLayout: React.FC<CustomSpeakerLayoutProps> = ({
  participantsBarPosition = "bottom",
}) => {
  const { useLocalParticipant } = useCallStateHooks();
  const local = useLocalParticipant();

  // Scale factor based on speaking intensity
  const intensity = useMemo(() => {
    if (!local) return 1;
    const base = local.isSpeaking ? 1.05 : 1.0;
    const level = Math.min(local.audioLevel ?? 0, 0.5); // clamp
    return base + level * 0.5; // max ~1.25
  }, [local?.isSpeaking, local?.audioLevel]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background">
      {/* Built-in layout */}
      <SpeakerLayout participantsBarPosition={participantsBarPosition} />

      {/* ChatGPT-style pulse overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* inner glow */}
        <motion.div
          className="w-40 h-40 rounded-full blur-3xl"
          animate={{
            scale: intensity,
            opacity: local?.isSpeaking ? 0.6 : 0.2,
          }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
            mass: 0.4,
          }}
          style={{
            background:
              "radial-gradient(circle at center, rgba(250,143,56,0.7) 0%, rgba(250,143,56,0.2) 70%, transparent 100%)",
          }}
        />
        {/* mid ripple */}
        <motion.div
          className="absolute w-56 h-56 rounded-full blur-3xl"
          animate={{
            scale: intensity * 1.2,
            opacity: local?.isSpeaking ? 0.4 : 0.1,
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
          style={{
            background:
              "radial-gradient(circle at center, rgba(250,143,56,0.4) 0%, rgba(250,143,56,0.15) 70%, transparent 100%)",
          }}
        />
        {/* outer faint ring */}
        <motion.div
          className="absolute w-72 h-72 rounded-full blur-3xl"
          animate={{
            scale: intensity * 1.4,
            opacity: local?.isSpeaking ? 0.25 : 0.05,
          }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 16,
          }}
          style={{
            background:
              "radial-gradient(circle at center, rgba(250,143,56,0.25) 0%, rgba(250,143,56,0.1) 70%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
};

export default CustomSpeakerLayout;
