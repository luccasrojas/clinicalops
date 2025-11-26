'use client'

import { Button } from '@/components/ui/button'
import axios from 'axios'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle,
  Loader2,
  Mic,
  Play,
  Square,
  Upload,
  XCircle,
  FolderOpen,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCreateHistoryFromRecording } from '../api/create-history-from-recording'
import { useGeneratePresignedUrl } from '../api/generate-presigned-url'
import { useHistoryStatus } from '../api/get-history-status'
import { NetworkStatusBadge } from './network-status-badge'
import { useNetworkStatus } from '../hooks/use-network-status'
import { useRecordingStorage } from '../hooks/use-recording-storage'
import { useEnhancedRecording } from '../hooks/use-enhanced-recording'
import { RecordingSegments } from './recording-segments'
import { useSyncManager } from '../hooks/use-sync-manager'
import { useToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingHistoryID, setProcessingHistoryID] = useState<string | null>(
    null,
  )
  const [savedRecordingID, setSavedRecordingID] = useState<string | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)

  const generatePresignedUrl = useGeneratePresignedUrl()
  const createHistory = useCreateHistoryFromRecording()
  const historyStatus = useHistoryStatus(processingHistoryID || '')
  const { isOnline } = useNetworkStatus()
  const { saveRecording, storageStats, refreshStorageStats } =
    useRecordingStorage()
  const { addToast } = useToast()
  const router = useRouter()

  // Track sync progress indicator
  const [showSyncProgress, setShowSyncProgress] = useState(false)

  // Setup sync manager with event callbacks
  const { isSyncing, syncProgress } = useSyncManager({
    autoSync: true,
    onSyncComplete: async () => {
      // Trigger cleanup after successful sync
      if (typeof window !== 'undefined' && (window as any).__cleanupTrigger) {
        await (window as any).__cleanupTrigger()
      }
    },
    onSyncEvent: (event) => {
      switch (event.type) {
        case 'sync_started':
          setShowSyncProgress(true)
          addToast({
            variant: 'info',
            title: 'Sincronizando grabaciones',
            description: 'Subiendo grabaciones pendientes al servidor...',
            duration: 3000,
          })
          break

        case 'sync_completed':
          setShowSyncProgress(false)
          addToast({
            variant: 'success',
            title: '¡Sincronización completada!',
            description: `${event.totalSynced} ${event.totalSynced === 1 ? 'grabación sincronizada' : 'grabaciones sincronizadas'} exitosamente.`,
            duration: 5000,
            action: {
              label: 'Ver historias',
              onClick: () => router.push('/dashboard/historias'),
            },
          })
          break

        case 'sync_failed':
          setShowSyncProgress(false)
          addToast({
            variant: 'error',
            title: 'Error en sincronización',
            description: `${event.totalFailed} ${event.totalFailed === 1 ? 'grabación falló' : 'grabaciones fallaron'}. ${event.totalSynced || 0} sincronizadas exitosamente.`,
            duration: 7000,
            action: {
              label: 'Ver detalles',
              onClick: () => router.push('/dashboard/grabacion/gestionar'),
            },
          })
          break

        case 'recording_synced':
          // Individual recording synced - could show subtle notification
          console.log(
            'Recording synced:',
            event.recordingId,
            'History ID:',
            event.historyID,
          )
          break

        case 'recording_failed':
          // Individual recording failed
          console.error('Recording failed:', event.recordingId, event.error)
          break
      }
    },
  })

  // Use enhanced recording hook with segment tracking
  const {
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    duration: durationSeconds,
    segments,
  } = useEnhancedRecording({
    onError: (err) => {
      console.error('Recording error:', err)
      if (onError) {
        onError(`${err.message}\n\n${err.instructions}`)
      }
    },
  })

  // Convert duration from seconds to hours:minutes:seconds
  const duration = {
    hours: Math.floor(durationSeconds / 3600),
    minutes: Math.floor((durationSeconds % 3600) / 60),
    seconds: durationSeconds % 60,
  }

  // Refresh storage stats periodically to keep pending count updated
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStorageStats()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [refreshStorageStats])

  // Warn user before leaving if recording is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if actively recording or paused (not stopped)
      if (status === 'recording' || status === 'paused') {
        e.preventDefault()
        // Modern browsers require returnValue to be set
        e.returnValue = ''
        // Some browsers show this message, others show a generic message
        return '¿Estás seguro de que quieres salir? La grabación en progreso se perderá.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [status])

  // Monitor processing status
  useEffect(() => {
    if (!historyStatus.data?.history) return

    const history = historyStatus.data.history
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (history.status === 'completed' && onComplete) {
      timeoutId = setTimeout(() => {
        setProcessingHistoryID(null)
        setSavedRecordingID(null)
        setRecordingBlob(null)
        onComplete(history.historyID)
      }, 0)
    } else if (history.status === 'failed' && onError) {
      timeoutId = setTimeout(() => {
        setProcessingHistoryID(null)
        setSavedRecordingID(null)
        onError(history.errorMessage || 'Error al procesar la grabación')
      }, 0)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [historyStatus.data, onComplete, onError])

  const handleStop = async () => {
    try {
      // Stop recording and get the blob
      const blob = await stopRecording()

      // Calculate total duration in seconds
      const totalSeconds = durationSeconds

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `recording_${timestamp}.webm`

      // Save to IndexedDB
      const recordingID = await saveRecording({
        doctorID,
        blob,
        fileName,
        mimeType: blob.type || 'audio/webm',
        duration: totalSeconds,
        size: blob.size,
        status: 'pending_upload',
        syncAttempts: 0,
        lastSyncAttempt: null,
        errorMessage: null,
        syncedAt: null,
        historyID: null,
        metadata: {},
      })

      setSavedRecordingID(recordingID)
      setRecordingBlob(blob)
      console.log('Recording saved to IndexedDB:', recordingID)
    } catch (error) {
      console.error('Error saving recording to IndexedDB:', error)
      if (onError) {
        onError('Error al guardar la grabación localmente')
      }
    }
  }

  const handleUploadAndProcess = async () => {
    if (!recordingBlob || !savedRecordingID) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `recording_${timestamp}.webm`

      // Get pre-signed URL
      const presignedData = await generatePresignedUrl.mutateAsync({
        doctorID,
        fileName,
        contentType: recordingBlob.type || 'audio/webm',
      })

      // Upload to S3 using pre-signed URL
      await axios.put(presignedData.uploadURL, recordingBlob, {
        headers: {
          'Content-Type': recordingBlob.type || 'audio/webm',
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

      // Note: We'll update the recording status to 'synced' in the sync manager later
      // For now, just log that upload was successful
      console.log(
        'Recording uploaded successfully, historyID:',
        result.history.historyID,
      )
    } catch (error: unknown) {
      setIsUploading(false)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al procesar la grabación'
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
    } catch (error: unknown) {
      setIsUploading(false)
      const errorMessage =
        error instanceof Error ? error.message : 'Error al subir el archivo'
      if (onError) {
        onError(errorMessage)
      }
      console.error('File upload error:', error)
    }
  }

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isStopped = status === 'stopped' && recordingBlob !== null
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
      if (!isOnline) {
        return 'Grabación guardada localmente. Sin conexión a internet - la transcripción se realizará automáticamente cuando se restaure la conexión.'
      }
      return 'Grabación lista. Presione "Transcribir" para procesar.'
    }
    if (!isOnline && (isRecording || isPaused)) {
      return 'Grabando sin conexión. La grabación se guardará localmente y se subirá automáticamente cuando se restaure la conexión.'
    }
    if (!isOnline) {
      return 'Sin conexión a internet. Puede grabar normalmente - las grabaciones se guardarán localmente y se sincronizarán automáticamente cuando se restaure la conexión.'
    }
    return 'Presione "Grabar" para iniciar o "Subir archivo" para cargar una grabación existente.'
  }

  return (
    <div className='flex min-h-[500px] sm:min-h-[600px] lg:min-h-[760px] w-full max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16 text-center'>
      <header className='flex w-full mb-12 flex-col items-center gap-4 sm:gap-6'>
        <div className='flex items-center justify-center gap-3 flex-wrap'>
          <h2 className='text-2xl sm:text-3xl font-semibold px-4'>
            Grabando Nueva Historia Clínica
          </h2>
          <NetworkStatusBadge />
        </div>
        {showSyncProgress && isSyncing && (
          <div className='flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>
              Sincronizando {syncProgress.current} de {syncProgress.total}...
            </span>
          </div>
        )}
        {storageStats && storageStats.pendingCount > 0 && (
          <Link href='/dashboard/grabacion/gestionar'>
            <div className='flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer'>
              <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold text-xs'>
                {storageStats.pendingCount}
              </span>
              <span>
                {storageStats.pendingCount === 1
                  ? 'grabación pendiente de sincronización'
                  : 'grabaciones pendientes de sincronización'}
              </span>
              <FolderOpen className='h-4 w-4' />
            </div>
          </Link>
        )}
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
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
              animate={
                isRecording
                  ? {
                      boxShadow: [
                        '0 0 0 0 rgba(20, 184, 166, 0.4)',
                        '0 0 0 20px rgba(20, 184, 166, 0)',
                      ],
                    }
                  : isPaused
                    ? {
                        boxShadow: [
                          '0 0 0 0 rgba(234, 179, 8, 0.4)',
                          '0 0 0 20px rgba(234, 179, 8, 0)',
                        ],
                      }
                    : {}
              }
              transition={
                isRecording || isPaused
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

            {/* PAUSADO text when paused */}
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='text-yellow-600 dark:text-yellow-400 font-semibold text-lg sm:text-xl'
              >
                PAUSADO
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Recording segments visualization */}
      {(isRecording || isPaused || isStopped) && segments.length > 0 && (
        <section className='w-full px-4'>
          <RecordingSegments
            segments={segments}
            isPaused={isPaused}
            showSummary={isStopped}
            totalDuration={durationSeconds}
          />
        </section>
      )}

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
                onClick={() => {
                  setRecordingBlob(null)
                  setSavedRecordingID(null)
                }}
                variant='outline'
                size='lg'
                className='text-sm sm:text-base'
              >
                Volver a Grabar
              </Button>
              <div className='flex flex-col items-center gap-2'>
                <Button
                  onClick={handleUploadAndProcess}
                  size='lg'
                  className='bg-teal-500 hover:bg-teal-600 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={!isOnline}
                  title={
                    !isOnline
                      ? 'Sin conexión a internet. La grabación se sincronizará automáticamente cuando se restaure la conexión.'
                      : 'Transcribir grabación a historia clínica'
                  }
                >
                  <span className='hidden sm:inline'>
                    Transcribir a Historia Clínica
                  </span>
                  <span className='sm:hidden'>Transcribir</span>
                </Button>
                {!isOnline && (
                  <p className='text-xs text-amber-600 dark:text-amber-400 text-center max-w-xs'>
                    La grabación se ha guardado localmente y se procesará
                    automáticamente cuando se restaure la conexión
                  </p>
                )}
              </div>
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
