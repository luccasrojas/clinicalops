"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  size?: number;
  accentColor?: string; // rgb string, e.g. "250,143,56"
}

/**
 * ChatGPT-style circular voice visualizer for Stream local mic state.
 * Shows a breathing gradient background, expands with voice energy,
 * and dims when mic is muted.
 */
export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  size = 220,
  //   accentColor = "250,143,56", // TecunTecs orange
  accentColor = "0,0,0", // TecunTecs orange
}) => {
  const { useLocalParticipant, useMicrophoneState } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const micState = useMicrophoneState();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const audioLevel = localParticipant?.audioLevel ?? 0;
  const isSpeaking = localParticipant?.isSpeaking ?? false;
  const micOff = micState.microphone.enabled === false;

  // Smooth reactive scale from audio level
  const springLevel = useSpring(audioLevel, {
    stiffness: 150,
    damping: 20,
    mass: 0.4,
  });

  // map level 0–1 → scale 1–1.25
  const scale = useTransform(springLevel, [0, 1], [1, 1.25]);

  // subtle breathing baseline
  const basePulse = useSpring(1, {
    stiffness: 50,
    damping: 15,
  });

  useEffect(() => {
    const loop = setInterval(() => {
      basePulse.set(1.02);
      setTimeout(() => basePulse.set(1), 1000);
    }, 3000);
    return () => clearInterval(loop);
  }, [basePulse]);

  // attach local video
  useEffect(() => {
    if (videoRef.current && localParticipant?.videoStream) {
      videoRef.current.srcObject = localParticipant.videoStream;
      videoRef.current.play().catch(() => {});
    }
  }, [localParticipant?.videoStream]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ opacity: micOff ? 0.3 : 1 }}
      style={{
        width: size,
        height: size,
        transformOrigin: "center",
      }}
    >
      {/* 🔵 Layered soft gradients */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: size * 2,
          height: size * 2,
          background: `radial-gradient(circle at center, rgba(${accentColor},0.5) 0%, rgba(${accentColor},0.1) 70%, transparent 100%)`,
        }}
        animate={{
          scale: isSpeaking ? 1.15 : 1,
          opacity: isSpeaking ? 0.7 : 0.4,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* base breathing pulse */}
      <motion.div
        className="absolute rounded-full blur-2xl"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background: `radial-gradient(circle at center, rgba(${accentColor},0.25) 0%, transparent 70%)`,
          scale: basePulse,
        }}
      />

      {/* 🎥 central circle (video or color fill) */}
      <motion.div
        className="relative rounded-full overflow-hidden shadow-lg border border-white/10 z-10"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          scale,
        }}
      >
        {localParticipant?.videoStream ? (
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `linear-gradient(145deg, rgba(${accentColor},0.25), rgba(${accentColor},0.6))`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
