'use client'

import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

interface AudioLevelIndicatorProps {
  audioLevel: number // 0-100
  isAudioDetected: boolean
  isRecording: boolean
  isPaused?: boolean
}

/**
 * Visual indicator showing real-time audio input level.
 * Helps users verify their microphone is working and audio is being captured.
 */
export function AudioLevelIndicator({
  audioLevel,
  isAudioDetected,
  isRecording,
  isPaused = false,
}: AudioLevelIndicatorProps) {
  // Show indicator when recording or paused
  if (!isRecording && !isPaused) return null

  return (
    <div className='flex flex-col items-center gap-3 w-full max-w-md'>
      {/* Audio level bars */}
      <div className='flex items-center gap-2 w-full'>
        <div className='flex items-center justify-center'>
          {isAudioDetected ? (
            <Mic className='h-5 w-5 text-teal-500' />
          ) : (
            <MicOff className='h-5 w-5 text-red-500' />
          )}
        </div>

        {/* Level bar container */}
        <div className='flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative'>
          {/* Animated level bar */}
          <motion.div
            className={`h-full ${
              isAudioDetected
                ? audioLevel > 70
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600'
                  : audioLevel > 30
                    ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                    : 'bg-gradient-to-r from-teal-300 to-teal-400'
                : 'bg-gray-400'
            }`}
            animate={{
              width: `${audioLevel}%`,
            }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          />

          {/* Grid lines for visual reference */}
          <div className='absolute inset-0 flex'>
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className='border-l border-gray-300 dark:border-gray-600'
                style={{ marginLeft: `${mark}%` }}
              />
            ))}
          </div>
        </div>

        {/* Percentage display */}
        <div className='w-12 text-right'>
          <span
            className={`text-sm font-mono ${
              isAudioDetected ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {audioLevel}%
          </span>
        </div>
      </div>

      {/* Status message */}
      <div className='text-xs text-center'>
        {isPaused ? (
          <motion.span
            className='text-yellow-600 dark:text-yellow-400 font-semibold'
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⏸ Grabación en pausa
          </motion.span>
        ) : isAudioDetected ? (
          <span className='text-teal-600 dark:text-teal-400'>
            ✓ Audio detectado - hable para ver el nivel
          </span>
        ) : (
          <motion.span
            className='text-red-600 dark:text-red-400 font-semibold'
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚠ No se detecta audio - verifique su micrófono
          </motion.span>
        )}
      </div>
    </div>
  )
}
