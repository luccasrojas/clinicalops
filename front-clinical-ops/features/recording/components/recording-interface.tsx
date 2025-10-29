'use client'

import { Button } from '@/components/ui/button'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Loader2,
  Mic,
  Play,
  Square,
  Upload,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import { useCreateHistoryFromRecording } from '../api/create-history-from-recording'
import { useGeneratePresignedUrl } from '../api/generate-presigned-url'
import { useHistoryStatus } from '../api/get-history-status'

type RecordingInterfaceProps = {
  doctorID: string
  onComplete?: (historyID: string) => void
  onError?: (error: string) => void
}

export function RecordingInterface({
  doctorID,
  onComplete,
  onError,
}: RecordingInterfaceProps) {
  const [duration, setDuration] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingHistoryID, setProcessingHistoryID] = useState<string | null>(
    null,
  )

  const generatePresignedUrl = useGeneratePresignedUrl()
  const createHistory = useCreateHistoryFromRecording()
  const historyStatus = useHistoryStatus(processingHistoryID || '')

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      console.log('Recording stopped', { blobUrl, blob })
    },
  })

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'recording') {
      interval = setInterval(() => {
        setDuration((prev) => {
          const totalSeconds =
            prev.hours * 3600 + prev.minutes * 60 + prev.seconds + 1
          return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status])

  // Monitor processing status
  useEffect(() => {
    if (!historyStatus.data?.history) return

    const history = historyStatus.data.history

    if (history.status === 'completed' && onComplete) {
      setProcessingHistoryID(null)
      clearBlobUrl()
      setDuration({ hours: 0, minutes: 0, seconds: 0 })
      onComplete(history.historyID)
    } else if (history.status === 'failed' && onError) {
      setProcessingHistoryID(null)
      onError(history.errorMessage || 'Error al procesar la grabación')
    }
  }, [historyStatus.data, onComplete, onError, clearBlobUrl])

  const handleStop = () => {
    stopRecording()
  }

  const handleUploadAndProcess = async () => {
    if (!mediaBlobUrl) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Fetch the blob from the URL
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `recording_${timestamp}.webm`

      // Get pre-signed URL
      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: blob.type || 'audio/webm',
      })

      // Upload to S3 using pre-signed URL
      await axios.put(presignedData.uploadURL, blob, {
        headers: {
          'Content-Type': blob.type || 'audio/webm',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          )
          setUploadProgress(percentCompleted)
        },
      })

      setIsUploading(false)

      // Construct the recording URL
      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`

      // Create medical history from recording (returns immediately with pending status)
      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      })

      // Start polling for status updates
      setProcessingHistoryID(result.history.historyID)
    } catch (error: any) {
      setIsUploading(false)
      const errorMessage = error.message || 'Error al procesar la grabación'
      if (onError) {
        onError(errorMessage)
      }
      console.error('Upload/Process error:', error)
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `upload_${timestamp}_${file.name}`

      // Get pre-signed URL
      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: file.type,
      })

      // Upload to S3
      await axios.put(presignedData.uploadURL, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          )
          setUploadProgress(percentCompleted)
        },
      })

      setIsUploading(false)

      // Construct the recording URL
      const recordingURL = `https://storage.clinicalops.co/${presignedData.fileKey}`

      // Create medical history from recording (returns immediately with pending status)
      const result = await createHistory.mutateAsync({
        doctorID,
        recordingURL,
      })

      // Start polling for status updates
      setProcessingHistoryID(result.history.historyID)
    } catch (error: any) {
      setIsUploading(false)
      const errorMessage = error.message || 'Error al subir el archivo'
      if (onError) {
        onError(errorMessage)
      }
      console.error('File upload error:', error)
    }
  }

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isStopped = status === 'stopped' && mediaBlobUrl
  const isProcessing = !!processingHistoryID
  const processingStatus = historyStatus.data?.history?.status

  const getStatusMessage = () => {
    if (isUploading) {
      return 'Subiendo grabación...'
    }
    if (isProcessing) {
      if (processingStatus === 'pending') {
        return 'Preparando procesamiento...'
      }
      if (processingStatus === 'processing') {
        return 'La IA está analizando la información para generar el documento. Este proceso puede tardar varios minutos.'
      }
    }
    if (isStopped) {
      return 'Grabación lista. Presione "Transcribir" para procesar.'
    }
    return 'Presione "Grabar" para iniciar o "Subir archivo" para cargar una grabación existente.'
  }

  return (
    <div className='flex min-h-[500px] sm:min-h-[600px] lg:min-h-[760px] w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16 text-center'>
      <header className='flex w-full mb-12 flex-col items-center gap-4 sm:gap-6'>
        <h2 className='text-2xl sm:text-3xl font-semibold px-4'>
          Grabando Nueva Historia Clínica
        </h2>
        <p className='text-sm sm:text-base leading-relaxed text-muted-foreground px-4'>
          {getStatusMessage()}
        </p>
      </header>

      <section className='flex flex-1 items-center justify-center'>
        <div className='flex flex-col items-center gap-8 sm:gap-12 lg:gap-16'>
          {/* Microphone button with animations */}
          <div className='relative flex items-center justify-center'>
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

            <motion.div
              className={`relative flex h-28 w-28 sm:h-36 sm:w-36 lg:h-40 lg:w-40 items-center justify-center rounded-full ${
                isRecording
                  ? 'bg-teal-500'
                  : isPaused
                    ? 'bg-yellow-500'
                    : 'bg-gray-200'
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
              <Mic className='h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white' />
            </motion.div>
          </div>

          {/* Timer display */}
          <div className='flex flex-col items-center gap-6 sm:gap-8 lg:gap-10'>
            <div className='flex items-center gap-3 sm:gap-6 lg:gap-12 text-3xl sm:text-4xl lg:text-5xl font-mono'>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>
                {String(duration.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>
                {String(duration.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>
                {String(duration.seconds).padStart(2, '0')}
              </span>
            </div>

            <div className='flex items-center justify-center gap-6 sm:gap-10 lg:gap-16 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground'>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>Horas</span>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>Minutos</span>
              <span className='w-12 sm:w-16 lg:w-24 text-center'>Segundos</span>
            </div>
          </div>
        </div>
      </section>

      <footer className='mt-8 sm:mt-12 lg:mt-20 flex w-full flex-col items-center gap-6 sm:gap-8 lg:gap-12'>
        <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6'>
          {!isRecording && !isPaused && !isStopped && (
            <Button
              onClick={startRecording}
              size='lg'
              className='bg-teal-500 hover:bg-teal-600 text-sm sm:text-base'
              disabled={isUploading || isProcessing}
            >
              <Mic className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
              Iniciar Grabación
            </Button>
          )}

          {(isRecording || isPaused) && (
            <>
              {isRecording && (
                <Button
                  onClick={pauseRecording}
                  variant='outline'
                  size='lg'
                  className='text-sm sm:text-base'
                >
                  <Square className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                  Pausar
                </Button>
              )}

              {isPaused && (
                <Button
                  onClick={resumeRecording}
                  size='lg'
                  className='bg-teal-500 hover:bg-teal-600 text-sm sm:text-base'
                >
                  <Play className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                  Reanudar
                </Button>
              )}

              <Button
                onClick={handleStop}
                variant='destructive'
                size='lg'
                className='text-sm sm:text-base'
              >
                <Square className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                Detener
              </Button>
            </>
          )}

          {isStopped && !isUploading && !isProcessing && (
            <>
              <Button
                onClick={() => clearBlobUrl()}
                variant='outline'
                size='lg'
                className='text-sm sm:text-base'
              >
                Volver a Grabar
              </Button>
              <Button
                onClick={handleUploadAndProcess}
                size='lg'
                className='bg-teal-500 hover:bg-teal-600 text-sm sm:text-base'
              >
                <span className='hidden sm:inline'>
                  Transcribir a Historia Clínica
                </span>
                <span className='sm:hidden'>Transcribir</span>
              </Button>
            </>
          )}
        </div>

        {isUploading && (
          <div className='w-full max-w-md'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                Subiendo archivo...
              </span>
              <span className='text-sm font-medium'>{uploadProgress}%</span>
            </div>
            <div className='h-2 w-full rounded-full bg-gray-200'>
              <motion.div
                className='h-2 rounded-full bg-teal-500'
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className='flex flex-col items-center gap-6'>
            <div className='flex items-center gap-4 text-base'>
              {processingStatus === 'completed' ? (
                <CheckCircle className='h-6 w-6 text-green-500' />
              ) : processingStatus === 'failed' ? (
                <XCircle className='h-6 w-6 text-red-500' />
              ) : (
                <Loader2 className='h-6 w-6 animate-spin text-teal-500' />
              )}
              <span className='text-sm font-medium'>
                {processingStatus === 'pending' && 'Iniciando procesamiento...'}
                {processingStatus === 'processing' &&
                  'Procesando Historia Clínica...'}
                {processingStatus === 'completed' && '¡Completado!'}
                {processingStatus === 'failed' && 'Error en el procesamiento'}
              </span>
            </div>
            {(processingStatus === 'pending' ||
              processingStatus === 'processing') && (
              <p className='max-w-md text-center text-sm leading-relaxed text-muted-foreground'>
                {processingStatus === 'pending'
                  ? 'Preparando el audio para transcripción...'
                  : 'Transcribiendo audio y generando nota clínica con IA. Esto puede tomar 2-3 minutos.'}
              </p>
            )}
          </div>
        )}

        {!isRecording &&
          !isPaused &&
          !isStopped &&
          !isUploading &&
          !isProcessing && (
            <div className='mt-8 sm:mt-10 lg:mt-14 border-t pt-6 sm:pt-8 w-full'>
              <label
                htmlFor='file-upload'
                className='flex cursor-pointer items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground px-4'
              >
                <Upload className='h-4 w-4' />
                <span className='text-xs sm:text-sm text-center'>
                  O subir archivo de audio desde el PC
                </span>
              </label>
              <input
                id='file-upload'
                type='file'
                accept='audio/*'
                onChange={handleFileUpload}
                className='hidden'
              />
            </div>
          )}
      </footer>
    </div>
  )
}
