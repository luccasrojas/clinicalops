"use client";

import { motion, useSpring } from "framer-motion";
import { useMemo } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";

interface LocalSpeakingVisualizerProps {
  size?: number; // px
  color?: string; // base hue for gradient
}

/**
 * A circular component that mimics ChatGPT Voice Mode.
 * Displays the local video feed and a fuzzy animated gradient ring
 * that gently pulses when the user is speaking.
 */
export const LocalSpeakingVisualizer: React.FC<
  LocalSpeakingVisualizerProps
> = ({
  size = 260,
  color = "250,143,56", // orange hsl → rgb for tecuntecs accent (#fa8f38)
}) => {
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  // use audioLevel (0–1) to drive the pulsing animation
  const level = localParticipant?.audioLevel ?? 0;
  const isSpeaking = localParticipant?.isSpeaking ?? false;

  // Smooth spring for audio level → scale mapping
  const smoothScale = useSpring(1 + Math.min(level * 2, 0.25), {
    stiffness: 100,
    damping: 20,
    mass: 0.4,
  });

  const blurLayers = useMemo(() => [1, 2, 3], []);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* 🔵 Multiple fuzzy gradient layers */}
      {blurLayers.map((n) => (
        <motion.div
          key={n}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * (1 + n * 0.1),
            height: size * (1 + n * 0.1),
            background: `radial-gradient(circle at center, rgba(${color},0.5) 0%, rgba(${color},0.15) 60%, transparent 100%)`,
            filter: "blur(40px)",
            zIndex: 0,
          }}
          animate={{
            opacity: isSpeaking ? 0.8 - n * 0.15 : 0.2 - n * 0.05,
            scale: isSpeaking ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 1.8 + n * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 🎙️ Central video bubble (local participant video) */}
      <motion.div
        className="relative rounded-full overflow-hidden shadow-md z-10 border border-white/20"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          transformOrigin: "center",
          scale: smoothScale,
        }}
      >
        {/* Stream auto-renders video for local participant */}
        <video
          ref={(el) => {
            if (el && localParticipant?.videoStream) {
              el.srcObject = localParticipant.videoStream;
              el.play().catch(() => {});
            }
          }}
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
};
