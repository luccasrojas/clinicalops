import { useCallback, useEffect, useRef, useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import {
  parseRecordingError,
  isMediaRecorderSupported,
  getNotSupportedError,
  type RecordingError,
} from '../utils/recording-errors'
import { errorLoggingService } from '../services/error-logging.service'

export type EnhancedRecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

export interface RecordingSegment {
  id: string
  startTime: number
  endTime: number | null
  duration: number
  blob: Blob | null
  status: 'recording' | 'paused' | 'completed'
}

export interface UseEnhancedRecordingOptions {
  mimeType?: string
  audioBitsPerSecond?: number
  onError?: (error: RecordingError) => void
}

export interface UseEnhancedRecordingReturn {
  status: EnhancedRecordingStatus
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => Promise<Blob>
  duration: number
  segments: RecordingSegment[]
  error: RecordingError | null
  isSupported: boolean
}

/**
 * Enhanced recording hook that wraps react-media-recorder with segment management.
 * Supports pause/resume with segment tracking and combines all segments into a single blob.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function useEnhancedRecording(
  options: UseEnhancedRecordingOptions = {},
): UseEnhancedRecordingReturn {
  const {
    mimeType = 'audio/webm;codecs=opus',
    audioBitsPerSecond = 128000,
    onError,
  } = options

  const [status, setStatus] = useState<EnhancedRecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [segments, setSegments] = useState<RecordingSegment[]>([])
  const [error, setError] = useState<RecordingError | null>(null)
  const [isSupported] = useState(() => isMediaRecorderSupported())

  // Track cumulative time across pauses
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)
  const lastPauseTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const currentSegmentIdRef = useRef<string | null>(null)
  const segmentBlobsRef = useRef<Blob[]>([])

  // Use react-media-recorder for the actual recording
  const {
    startRecording: startReactRecording,
    pauseRecording: pauseReactRecording,
    resumeRecording: resumeReactRecording,
    stopRecording: stopReactRecording,
    error: recorderError,
  } = useReactMediaRecorder({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    mediaRecorderOptions: {
      mimeType: MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : 'audio/webm',
      audioBitsPerSecond,
    },
    onStop: async (_blobUrl, blob) => {
      // When a segment stops, save its blob
      if (blob && currentSegmentIdRef.current) {
        segmentBlobsRef.current.push(blob)

        // Update the segment with the blob
        setSegments((prev) =>
          prev.map((seg) =>
            seg.id === currentSegmentIdRef.current
              ? { ...seg, blob, status: 'completed' as const }
              : seg,
          ),
        )
      }
    },
  })

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
      animationFrameRef.current = requestAnimationFrame(updateDuration)
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [status, updateDuration])

  // Handle errors from react-media-recorder
  useEffect(() => {
    if (recorderError) {
      const err = parseRecordingError(new Error(recorderError))
      setError(err)
      setStatus('error')
      onError?.(err)
      errorLoggingService.logError(new Error(recorderError), {
        action: 'react-media-recorder error',
      })
    }
  }, [recorderError, onError])

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
      // Initialize first segment
      const segmentId = `segment-${Date.now()}`
      const now = Date.now()

      currentSegmentIdRef.current = segmentId
      startTimeRef.current = now
      pausedDurationRef.current = 0
      segmentBlobsRef.current = []

      const newSegment: RecordingSegment = {
        id: segmentId,
        startTime: now,
        endTime: null,
        duration: 0,
        blob: null,
        status: 'recording',
      }

      setSegments([newSegment])
      setStatus('recording')
      setError(null)

      // Start react-media-recorder
      startReactRecording()
    } catch (err) {
      const error = parseRecordingError(err)
      setError(error)
      setStatus('error')
      onError?.(error)
      errorLoggingService.logError(err, {
        action: 'startRecording',
        additionalInfo: { errorType: error.type },
      })
    }
  }, [isSupported, onError, startReactRecording])

  const pauseRecording = useCallback(() => {
    if (status === 'recording') {
      const now = Date.now()
      lastPauseTimeRef.current = now

      // Update current segment
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === currentSegmentIdRef.current
            ? {
                ...seg,
                endTime: now,
                duration: Math.floor((now - seg.startTime) / 1000),
                status: 'paused' as const,
              }
            : seg,
        ),
      )

      setStatus('paused')

      // Pause react-media-recorder
      pauseReactRecording()
    }
  }, [status, pauseReactRecording])

  const resumeRecording = useCallback(() => {
    if (status === 'paused') {
      const now = Date.now()

      // Track paused duration to maintain accurate timer
      if (lastPauseTimeRef.current > 0) {
        pausedDurationRef.current += now - lastPauseTimeRef.current
      }

      // Create new segment
      const segmentId = `segment-${now}`
      currentSegmentIdRef.current = segmentId

      const newSegment: RecordingSegment = {
        id: segmentId,
        startTime: now,
        endTime: null,
        duration: 0,
        blob: null,
        status: 'recording',
      }

      setSegments((prev) => [...prev, newSegment])
      setStatus('recording')

      // Resume react-media-recorder
      resumeReactRecording()
    }
  }, [status, resumeReactRecording])

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (status !== 'recording' && status !== 'paused') {
        const err = parseRecordingError(new Error('No hay grabación activa'))
        reject(err)
        return
      }

      const now = Date.now()

      // Update final segment
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === currentSegmentIdRef.current
            ? {
                ...seg,
                endTime: now,
                duration: Math.floor((now - seg.startTime) / 1000),
                status: 'completed' as const,
              }
            : seg,
        ),
      )

      setStatus('stopped')

      // Stop react-media-recorder and wait for the blob
      stopReactRecording()

      // Wait a bit for the onStop callback to fire and collect the final blob
      setTimeout(async () => {
        try {
          // Validate that we have segment blobs
          if (segmentBlobsRef.current.length === 0) {
            throw new Error('Audio inválido - la grabación no contiene datos')
          }

          // Validate each segment blob has size > 0 bytes
          for (let i = 0; i < segmentBlobsRef.current.length; i++) {
            const blob = segmentBlobsRef.current[i]
            if (!blob || blob.size === 0) {
              throw new Error(
                `Audio inválido - el segmento ${i + 1} no contiene datos`,
              )
            }
          }

          // If only one segment, validate and return it directly
          if (segmentBlobsRef.current.length === 1) {
            const blob = segmentBlobsRef.current[0]

            // Validate final blob
            await validateAudioBlob(blob)

            resolve(blob)
            return
          }

          // Combine multiple segments using Web Audio API
          const combinedBlob = await combineAudioBlobs(
            segmentBlobsRef.current,
            mimeType,
          )

          // Validate final combined blob
          await validateAudioBlob(combinedBlob)

          resolve(combinedBlob)
        } catch (err) {
          const error = parseRecordingError(err)
          setError(error)
          setStatus('error')
          onError?.(error)
          errorLoggingService.logError(err, {
            action: 'stopRecording',
            additionalInfo: { errorType: error.type },
          })
          reject(error)
        }
      }, 500) // Give time for the final blob to be captured
    })
  }, [status, stopReactRecording, mimeType, onError])

  return {
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    duration,
    segments,
    error,
    isSupported,
  }
}

/**
 * Validates that an audio blob is valid and playable.
 * Requirements: 1.6, 7.6, 7.7
 */
async function validateAudioBlob(blob: Blob): Promise<void> {
  // Validate blob has valid size
  if (!blob || blob.size === 0) {
    throw new Error('Audio inválido - la grabación no contiene datos')
  }

  // Validate MIME type
  if (!blob.type || !blob.type.startsWith('audio/')) {
    throw new Error(
      `Audio inválido - tipo MIME no válido: ${blob.type || 'desconocido'}`,
    )
  }

  // Validate blob is playable by attempting to create an audio element
  try {
    const audio = new Audio()
    const url = URL.createObjectURL(blob)

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(
          new Error(
            'Audio inválido - no se pudo validar la reproducción (timeout)',
          ),
        )
      }, 5000)

      audio.onloadedmetadata = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)

        // Check if audio has valid duration
        if (!audio.duration || audio.duration === 0 || isNaN(audio.duration)) {
          reject(
            new Error('Audio inválido - la grabación no tiene duración válida'),
          )
        } else {
          resolve()
        }
      }

      audio.onerror = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        reject(
          new Error(
            'Audio inválido - el archivo no se puede reproducir. Intente grabar nuevamente.',
          ),
        )
      }

      audio.src = url
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Audio inválido - error al validar la grabación')
  }
}

/**
 * Combines multiple audio blobs into a single continuous blob using Web Audio API.
 * This ensures the final recording is playable and continuous.
 */
async function combineAudioBlobs(
  blobs: Blob[],
  mimeType: string,
): Promise<Blob> {
  try {
    // Create an audio context
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const audioContext = new AudioContextClass()

    // Decode all blobs to audio buffers
    const audioBuffers: AudioBuffer[] = []

    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      audioBuffers.push(audioBuffer)
    }

    // Calculate total length
    const totalLength = audioBuffers.reduce(
      (sum, buffer) => sum + buffer.length,
      0,
    )

    // Create a new buffer with the combined length
    const combinedBuffer = audioContext.createBuffer(
      audioBuffers[0].numberOfChannels,
      totalLength,
      audioBuffers[0].sampleRate,
    )

    // Copy all buffers into the combined buffer
    let offset = 0
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel)
        combinedBuffer.copyToChannel(channelData, channel, offset)
      }
      offset += buffer.length
    }

    // Convert the combined buffer back to a blob
    const combinedBlob = await audioBufferToBlob(combinedBuffer, mimeType)

    // Close the audio context
    await audioContext.close()

    return combinedBlob
  } catch (error) {
    console.error('Error combining audio blobs:', error)
    // Fallback: just concatenate the blobs
    return new Blob(blobs, { type: mimeType })
  }
}

/**
 * Converts an AudioBuffer to a Blob using MediaRecorder.
 */
async function audioBufferToBlob(
  audioBuffer: AudioBuffer,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create an offline audio context to render the buffer
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate,
    )

    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineContext.destination)
    source.start()

    offlineContext.startRendering().then((renderedBuffer) => {
      // Create a MediaStream from the rendered buffer
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const tempContext = new AudioContextClass()
      const mediaStreamDestination = tempContext.createMediaStreamDestination()

      const sourceNode = tempContext.createBufferSource()
      sourceNode.buffer = renderedBuffer
      sourceNode.connect(mediaStreamDestination)
      sourceNode.start()

      // Record the stream
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType)
          ? mimeType
          : 'audio/webm',
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        resolve(blob)
      }

      mediaRecorder.onerror = (error) => {
        reject(error)
      }

      mediaRecorder.start()

      // Stop after the duration of the buffer
      setTimeout(
        () => {
          mediaRecorder.stop()
          sourceNode.stop()
        },
        renderedBuffer.duration * 1000 + 100,
      )
    })
  })
}
