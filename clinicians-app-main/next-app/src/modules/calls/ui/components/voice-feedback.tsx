"use client";

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useEffect } from "react";

interface VoiceFeedbackProps {
  size?: number;
  accentColor?: string; // e.g. "250,143,56"
}

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({
  size = 220,
  accentColor = "250,143,56",
}) => {
  const { useLocalParticipant } = useCallStateHooks();
  const local = useLocalParticipant();

  const level = local?.audioLevel ?? 0;
  const isSpeaking = local?.isSpeaking ?? false;

  // smooth spring for scale
  const smoothed = useSpring(level, {
    stiffness: 180,
    damping: 25,
    mass: 0.4,
  });

  // map 0–1 → 1–1.6 scale
  const scale = useTransform(smoothed, [0, 1], [1, 1.6]);

  // subtle breathing loop (always alive)
  useEffect(() => {
    const loop = setInterval(() => {
      smoothed.set(0.05);
      setTimeout(() => smoothed.set(0), 1000);
    }, 3000);
    return () => clearInterval(loop);
  }, [smoothed]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 🔹 background glow */}
      {false && (
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: size * 1.8,
            height: size * 1.8,
            background: `radial-gradient(circle at center, rgba(${accentColor},0.45) 0%, rgba(${accentColor},0.15) 70%, transparent 100%)`,
          }}
          animate={{
            scale: isSpeaking ? 1.15 : [1, 1.05, 1],
            opacity: isSpeaking ? 0.8 : 0.4,
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 3,
            ease: "easeInOut",
            repeat: isSpeaking ? 0 : Infinity,
          }}
        />
      )}

      {/* 🔹 main orb */}
      {false && (
        <motion.div
          className="relative rounded-full shadow-lg"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            background: `radial-gradient(circle at top left, rgba(${accentColor},0.9), rgba(${accentColor},0.4))`,
            scale,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />
      )}

      {/* 🔹 rings EVERY time you speak */}
      <AnimatePresence>
        {isSpeaking &&
          [0, 1, 2].map((n) => (
            <motion.div
              key={n}
              className="absolute rounded-full border-2 border-orange-400/40"
              style={{
                width: size * 0.75,
                height: size * 0.75,
              }}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{
                // scale: 2.2 + n * 0.3
                scale: 0.03 + n * 0.003,
                opacity: 0,
              }}
              transition={{
                duration: 1.2 + n * 0.2,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
};
