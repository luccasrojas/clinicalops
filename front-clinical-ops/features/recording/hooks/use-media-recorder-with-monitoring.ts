import { useCallback, useRef } from 'react'
import {
  useMediaRecorder,
  type UseMediaRecorderOptions,
  type UseMediaRecorderReturn,
} from './use-media-recorder'
import { performanceMonitoringService } from '../services/performance-monitoring.service'

/**
 * Wrapper around useMediaRecorder that adds performance monitoring
 */
export function useMediaRecorderWithMonitoring(
  options: UseMediaRecorderOptions = {},
): UseMediaRecorderReturn {
  const recordingIdRef = useRef<string | null>(null)

  const mediaRecorder = useMediaRecorder(options)

  // Wrap startRecording to track performance
  const startRecording = useCallback(async () => {
    // Generate recording ID for tracking
    recordingIdRef.current = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Track recording start
    performanceMonitoringService.startRecording(recordingIdRef.current)

    // Call original startRecording
    await mediaRecorder.startRecording()
  }, [mediaRecorder])

  // Wrap stopRecording to track completion
  const stopRecording = useCallback(async (): Promise<Blob> => {
    const blob = await mediaRecorder.stopRecording()

    // Track recording completion
    if (recordingIdRef.current) {
      performanceMonitoringService.completeRecording(
        recordingIdRef.current,
        mediaRecorder.duration,
        blob.size,
        blob.type,
      )
    }

    return blob
  }, [mediaRecorder])

  return {
    ...mediaRecorder,
    startRecording,
    stopRecording,
  }
}
