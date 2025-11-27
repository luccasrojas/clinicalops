'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { useAudioLevel } from '../hooks/use-audio-level'

interface AudioLevelAnimationProps {
  isRecording: boolean
  mediaStream: MediaStream | null
  className?: string
}

/**
 * Audio level animation component that displays 5 vertical bars
 * responding to real-time microphone input levels.
 * Design inspired by ChatGPT voice input visualization.
 */
export function AudioLevelAnimation({
  isRecording,
  mediaStream,
  className = '',
}: AudioLevelAnimationProps) {
  const audioLevel = useAudioLevel(mediaStream, isRecording)

  // Threshold below which we show idle animation
  const IDLE_THRESHOLD = 0.05
  const isIdle = audioLevel < IDLE_THRESHOLD

  // Generate heights for 5 bars based on audio level
  // Each bar has a slightly different multiplier for visual variety
  const barMultipliers = [0.6, 0.9, 1.0, 0.85, 0.65]

  const getBarHeight = (index: number) => {
    if (isIdle) {
      // Idle state: minimal heights with subtle variation
      return 8 + index * 2
    }

    // Active state: scale proportionally to audio level
    const baseHeight = 8
    const maxHeight = 64 // Maximum bar height in pixels
    const scaledHeight =
      baseHeight + audioLevel * maxHeight * barMultipliers[index]

    return Math.min(scaledHeight, maxHeight)
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Animated ripple effects when recording */}
      {isRecording && (
        <>
          <motion.div
            className='absolute rounded-full bg-teal-500/20'
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: '112px',
              height: '112px',
            }}
          />
          <motion.div
            className='absolute rounded-full bg-teal-500/30'
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            style={{
              width: '112px',
              height: '112px',
            }}
          />
        </>
      )}

      {/* Main microphone button */}
      <motion.div
        className={`relative flex h-28 w-28 sm:h-36 sm:w-36 lg:h-40 lg:w-40 items-center justify-center rounded-full ${
          isRecording ? 'bg-teal-500' : 'bg-gray-200'
        }`}
        animate={
          isRecording
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(20, 184, 166, 0.4)',
                  '0 0 0 20px rgba(20, 184, 166, 0)',
                ],
              }
            : {}
        }
        transition={
          isRecording
            ? {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }
            : {}
        }
      >
        {/* Show bars when recording, otherwise show mic icon */}
        {isRecording ? (
          <div className='flex items-center justify-center gap-1.5 h-16'>
            {barMultipliers.map((_, index) => (
              <motion.div
                key={index}
                className='w-1.5 bg-white rounded-full'
                animate={{
                  height: getBarHeight(index),
                }}
                transition={{
                  duration: isIdle ? 1.5 : 0.1,
                  ease: isIdle ? 'easeInOut' : 'linear',
                  repeat: isIdle ? Infinity : 0,
                  repeatType: isIdle ? 'reverse' : undefined,
                  delay: isIdle ? index * 0.1 : 0,
                }}
                style={{
                  minHeight: '8px',
                }}
              />
            ))}
          </div>
        ) : (
          <Mic className='h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white' />
        )}
      </motion.div>
    </div>
  )
}
