'use client'

import { motion } from 'framer-motion'
import { Circle, Pause } from 'lucide-react'
import type { RecordingSegment } from '../hooks/use-enhanced-recording'

interface RecordingSegmentsProps {
  segments: RecordingSegment[]
  isPaused: boolean
  showSummary?: boolean
  totalDuration?: number
}

/**
 * Component that displays recording segments in real-time.
 * Shows segment number, duration, and status with visual indicators.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function RecordingSegments({
  segments,
  isPaused,
  showSummary = false,
  totalDuration = 0,
}: RecordingSegmentsProps) {
  if (segments.length === 0) {
    return null
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const calculateTotalDuration = (): number => {
    return segments.reduce((sum, segment) => sum + segment.duration, 0)
  }

  const getStatusLabel = (segment: RecordingSegment): string => {
    if (segment.status === 'recording') return 'Grabando'
    if (segment.status === 'paused') return 'Pausado'
    return 'Completado'
  }

  const getStatusColor = (segment: RecordingSegment): string => {
    if (segment.status === 'recording')
      return 'text-teal-600 dark:text-teal-400'
    if (segment.status === 'paused')
      return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className='w-full max-w-md mx-auto mt-6'>
      {/* Paused indicator */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-center gap-2 mb-4 text-yellow-600 dark:text-yellow-400 font-semibold'
        >
          <Pause className='h-5 w-5' />
          <span>PAUSADO</span>
        </motion.div>
      )}

      {/* Summary display when recording is stopped */}
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-4 p-4 rounded-lg border border-teal-500 bg-teal-50 dark:bg-teal-950/30'
        >
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Grabación completada
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                {segments.length}{' '}
                {segments.length === 1 ? 'segmento' : 'segmentos'}
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm font-semibold text-teal-600 dark:text-teal-400'>
                {formatDuration(totalDuration || calculateTotalDuration())}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                Duración total
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Visual separator */}
      {showSummary && segments.length > 0 && (
        <div className='relative my-4'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
          </div>
          <div className='relative flex justify-center text-xs'>
            <span className='bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400'>
              Segmentos
            </span>
          </div>
        </div>
      )}

      {/* Segments list */}
      <div className='space-y-2'>
        {segments.map((segment, index) => {
          const isActive = segment.status === 'recording'
          const segmentNumber = index + 1

          return (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isActive
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Segment indicator */}
              <div className='shrink-0'>
                {isActive ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Circle className='h-4 w-4 fill-teal-500 text-teal-500' />
                  </motion.div>
                ) : (
                  <Circle
                    className={`h-4 w-4 ${
                      segment.status === 'paused'
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'fill-gray-400 text-gray-400'
                    }`}
                  />
                )}
              </div>

              {/* Segment info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Segmento {segmentNumber}
                  </span>
                  <span
                    className={`text-xs font-medium ${getStatusColor(segment)}`}
                  >
                    {getStatusLabel(segment)}
                  </span>
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Duración: {formatDuration(segment.duration)}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
