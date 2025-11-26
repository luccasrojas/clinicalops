import { useCallback, useEffect, useRef, useState } from 'react'
import {
  parseRecordingError,
  isMediaRecorderSupported,
  getNotSupportedError,
  type RecordingError,
} from '../utils/recording-errors'
import { errorLoggingService } from '../services/error-logging.service'
import { performanceMonitoringService } from '../services/performance-monitoring.service'

export type MediaRecorderStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

export interface UseMediaRecorderOptions {
  mimeType?: string
  audioBitsPerSecond?: number
  onDataAvailable?: (blob: Blob) => void
  onError?: (error: RecordingError) => void
}

export interface UseMediaRecorderReturn {
  status: MediaRecorderStatus
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<Blob>
  duration: number
  error: RecordingError | null
  isSupported: boolean
  isPauseResumeSupported: boolean // true if browser supports pause/resume
  audioLevel: number // 0-100, current audio level
  isAudioDetected: boolean // true if audio is being captured
}

/**
 * Custom hook for audio recording using the native MediaRecorder API.
 * Supports pause/resume functionality with continuous blob generation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function useMediaRecorder(
  options: UseMediaRecorderOptions = {},
): UseMediaRecorderReturn {
  const {
    mimeType = 'audio/webm;codecs=opus',
    audioBitsPerSecond = 128000,
    onDataAvailable,
    onError,
  } = options

  const [status, setStatus] = useState<MediaRecorderStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<RecordingError | null>(null)
  const [isSupported] = useState(() => isMediaRecorderSupported())
  const [isPauseResumeSupported] = useState(() => {
    // Check if MediaRecorder supports pause/resume
    // Safari doesn't support these methods
    return typeof MediaRecorder !== 'undefined' &&
           typeof MediaRecorder.prototype.pause === 'function' &&
           typeof MediaRecorder.prototype.resume === 'function'
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const [isAudioDetected, setIsAudioDetected] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)
  const lastPauseTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioLevelFrameRef = useRef<number | null>(null)
  const lastAudioDetectionRef = useRef<number>(0)

  // Audio level monitoring using Web Audio API
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    analyser.getByteFrequencyData(dataArray)

    // Calculate average volume level (0-255)
    const sum = dataArray.reduce((acc, val) => acc + val, 0)
    const average = sum / bufferLength

    // Convert to percentage (0-100)
    const level = Math.min(100, Math.round((average / 255) * 100))
    setAudioLevel(level)

    // Detect if audio is present (threshold: 2% to avoid noise floor)
    const isAudioPresent = level > 2
    setIsAudioDetected(isAudioPresent)

    // Track last time we detected audio
    if (isAudioPresent) {
      lastAudioDetectionRef.current = Date.now()
    }

    // Continue monitoring if recording or paused (to show level when resuming)
    if (status === 'recording' || status === 'paused') {
      audioLevelFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }, [status])

  // Duration timer using requestAnimationFrame for precision
  const updateDuration = useCallback(() => {
    if (status === 'recording' && startTimeRef.current > 0) {
      const elapsed =
        Date.now() - startTimeRef.current - pausedDurationRef.current
      setDuration(Math.floor(elapsed / 1000))
      animationFrameRef.current = requestAnimationFrame(updateDuration)
    }
  }, [status])

  useEffect(() => {
    if (status === 'recording') {
      // Start both duration and audio level monitoring
      animationFrameRef.current = requestAnimationFrame(updateDuration)
      audioLevelFrameRef.current = requestAnimationFrame(updateAudioLevel)
    } else if (status === 'paused') {
      // When paused, stop duration timer but keep audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // Continue audio level monitoring
      audioLevelFrameRef.current = requestAnimationFrame(updateAudioLevel)
    } else {
      // Stop both when idle or stopped
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioLevelFrameRef.current) {
        cancelAnimationFrame(audioLevelFrameRef.current)
        audioLevelFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioLevelFrameRef.current) {
        cancelAnimationFrame(audioLevelFrameRef.current)
      }
    }
  }, [status, updateDuration, updateAudioLevel])

  // Cleanup function for streams and object URLs
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current = null
    }
    if (audioLevelFrameRef.current) {
      cancelAnimationFrame(audioLevelFrameRef.current)
      audioLevelFrameRef.current = null
    }
    chunksRef.current = []
    startTimeRef.current = 0
    pausedDurationRef.current = 0
    lastPauseTimeRef.current = 0
    lastAudioDetectionRef.current = 0
    setDuration(0)
    setAudioLevel(0)
    setIsAudioDetected(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const err = getNotSupportedError()
      setError(err)
      setStatus('error')
      onError?.(err)
      errorLoggingService.logError(new Error('MediaRecorder not supported'), {
        action: 'startRecording',
      })
      return
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      // Set up audio level monitoring with Web Audio API
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const audioContext = new AudioContextClass()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      // Configure analyser for real-time monitoring
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Determine the best supported MIME type
      let selectedMimeType = mimeType
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const fallbackTypes = [
          'audio/webm',
          'audio/ogg',
          'audio/mp4',
          'audio/wav',
        ]
        selectedMimeType =
          fallbackTypes.find((type) => MediaRecorder.isTypeSupported(type)) ||
          ''
      }

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond,
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Handle data available event - accumulate chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const err = parseRecordingError(
          new Error(`Error de MediaRecorder: ${event}`),
        )
        setError(err)
        setStatus('error')
        onError?.(err)
        errorLoggingService.logError(
          err.originalError || new Error(err.message),
          {
            action: 'mediaRecorder.onerror',
            additionalInfo: { errorType: err.type },
          },
        )
        cleanup()
      }

      // Start recording
      mediaRecorder.start(100) // Request data every 100ms for smooth accumulation
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0
      setStatus('recording')
      setError(null)
    } catch (err) {
      const error = parseRecordingError(err)
      setError(error)
      setStatus('error')
      onError?.(error)
      errorLoggingService.logError(err, {
        action: 'startRecording',
        additionalInfo: { errorType: error.type },
      })
      cleanup()
    }
  }, [isSupported, mimeType, audioBitsPerSecond, onError, cleanup])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause()
      lastPauseTimeRef.current = Date.now()
      setStatus('paused')
    }
  }, [status])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused') {
      // Track paused duration to maintain accurate timer
      if (lastPauseTimeRef.current > 0) {
        pausedDurationRef.current += Date.now() - lastPauseTimeRef.current
      }
      mediaRecorderRef.current.resume()
      setStatus('recording')
    }
  }, [status])

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        const err = parseRecordingError(new Error('No hay grabación activa'))
        reject(err)
        return
      }

      const mediaRecorder = mediaRecorderRef.current

      // Handle stop event - create final blob from all chunks
      mediaRecorder.onstop = () => {
        try {
          // Create single continuous blob from all accumulated chunks
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          })

          setStatus('stopped')
          onDataAvailable?.(blob)
          cleanup()
          resolve(blob)
        } catch (err) {
          const error = parseRecordingError(err)
          setError(error)
          setStatus('error')
          onError?.(error)
          errorLoggingService.logError(err, {
            action: 'stopRecording',
            additionalInfo: { errorType: error.type },
          })
          cleanup()
          reject(error)
        }
      }

      // Stop the recording
      mediaRecorder.stop()
    })
  }, [onDataAvailable, onError, cleanup])

  return {
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    duration,
    error,
    isSupported,
    isPauseResumeSupported,
    audioLevel,
    isAudioDetected,
  }
}
