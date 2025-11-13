"use client";

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { SpeakerLayout } from "@stream-io/video-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface CustomSpeakerLayoutProps {
  participantsBarPosition?: "top" | "bottom" | "left" | "right" | null;
}

/**
 * A wrapper around SpeakerLayout that adds animated "listening" rings
 * around the dominant speaker or any participant currently speaking.
 */
export const CustomSpeakerLayout: React.FC<CustomSpeakerLayoutProps> = ({
  participantsBarPosition = "bottom",
}) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const speakingParticipants = useMemo(
    () => participants.filter((p) => p.isSpeaking || p.audioLevel > 0.05),
    [participants]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
      {/* 🔸 Built-in layout */}
      <SpeakerLayout participantsBarPosition={participantsBarPosition} />

      {/* 🔸 Overlay fuzzy animated gradients for active speakers */}
      <AnimatePresence>
        {speakingParticipants.map((p) => (
          <motion.div
            key={p.sessionId}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.5,
              scale: 1 + Math.min(p.audioLevel * 2, 0.3), // subtle scaling by volume
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              mass: 0.5,
            }}
          >
            <div
              className="w-64 h-64 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle at center, rgba(250,143,56,0.6) 0%, rgba(250,143,56,0.15) 70%, transparent 100%)`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
export default CustomSpeakerLayout;
