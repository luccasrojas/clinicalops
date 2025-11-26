'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  Upload,
  Trash2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RecordingRecord,
  RecordingStatus,
} from '../services/recording-storage.service'

type RecordingCardProps = {
  recording: RecordingRecord
  onPlay?: (recording: RecordingRecord) => void
  onUpload?: (recording: RecordingRecord) => Promise<void>
  onDelete?: (recording: RecordingRecord) => Promise<void>
  onRetry?: (recording: RecordingRecord) => Promise<void>
}

export function RecordingCard({
  recording,
  onPlay,
  onUpload,
  onDelete,
  onRetry,
}: RecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)

  const getStatusBadgeVariant = (status: RecordingStatus) => {
    switch (status) {
      case 'synced':
        return 'success'
      case 'pending_upload':
        return 'warning'
      case 'failed':
        return 'destructive'
      case 'uploading':
        return 'default'
      case 'partial':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: RecordingStatus) => {
    switch (status) {
      case 'synced':
        return 'Sincronizado'
      case 'pending_upload':
        return 'Pendiente'
      case 'failed':
        return 'Fallido'
      case 'uploading':
        return 'Subiendo'
      case 'partial':
        return 'Parcial'
      default:
        return status
    }
  }

  const handlePlayPause = async () => {
    // Create audio element on first use
    if (!audioRef.current) {
      const url = URL.createObjectURL(recording.blob)
      setAudioUrl(url)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        playPromiseRef.current = null
      })

      audio.addEventListener('error', (e) => {
        setIsPlaying(false)
        playPromiseRef.current = null
        console.error('Error playing audio:', e)
      })
    }

    const audio = audioRef.current

    // Toggle play/pause
    if (isPlaying) {
      // Pause the audio
      audio.pause()
      setIsPlaying(false)
      playPromiseRef.current = null
    } else {
      // Play the audio
      try {
        const playPromise = audio.play()
        playPromiseRef.current = playPromise

        await playPromise

        // Only update state if play succeeded
        setIsPlaying(true)
        playPromiseRef.current = null

        if (onPlay) {
          onPlay(recording)
        }
      } catch (error) {
        // Clear the promise ref on any error
        playPromiseRef.current = null

        const err = error as Error
        // Silently handle AbortError (happens when user clicks rapidly)
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error('Failed to play audio:', error)
        }

        setIsPlaying(false)
      }
    }
  }

  const handleUpload = async () => {
    if (!onUpload) return
    setIsUploading(true)
    try {
      await onUpload(recording)
    } catch (error) {
      console.error('Error uploading recording:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry(recording)
    } catch (error) {
      console.error('Error retrying upload:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(recording)
      setShowDeleteDialog(false)

      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      playPromiseRef.current = null
    } catch (error) {
      console.error('Error deleting recording:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Cleanup on unmount or when audioUrl changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      playPromiseRef.current = null
    }
  }, [audioUrl])

  const canUpload =
    recording.status === 'pending_upload' || recording.status === 'partial'
  const canRetry = recording.status === 'failed'
  const canDelete = recording.status !== 'uploading'

  return (
    <>
      <div className='border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors'>
        <div className='flex flex-col gap-4'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-2 flex-wrap'>
                <h3 className='font-medium truncate'>{recording.fileName}</h3>
                <Badge variant={getStatusBadgeVariant(recording.status)}>
                  {getStatusLabel(recording.status)}
                </Badge>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground'>
                <div>
                  <span className='font-medium'>Fecha:</span>{' '}
                  {new Date(recording.createdAt).toLocaleDateString('es-ES')}
                </div>
                <div>
                  <span className='font-medium'>Hora:</span>{' '}
                  {new Date(recording.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div>
                  <span className='font-medium'>Duración:</span>{' '}
                  {Math.floor(recording.duration / 60)}:
                  {String(Math.floor(recording.duration % 60)).padStart(2, '0')}
                </div>
                <div>
                  <span className='font-medium'>Tamaño:</span>{' '}
                  {(recording.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {recording.errorMessage && (
            <div className='flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
              <AlertCircle className='h-4 w-4 text-destructive mt-0.5 shrink-0' />
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-destructive'>Error</p>
                <p className='text-sm text-destructive/90'>
                  {recording.errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Audio Player (inline) */}
          {audioUrl && (
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-md'>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handlePlayPause}
                className='shrink-0'
              >
                {isPlaying ? (
                  <Pause className='h-4 w-4' />
                ) : (
                  <Play className='h-4 w-4' />
                )}
              </Button>
              <div className='flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden'>
                <div className='h-full bg-teal-500 w-0' />
              </div>
              <span className='text-xs text-muted-foreground shrink-0'>
                {Math.floor(recording.duration / 60)}:
                {String(Math.floor(recording.duration % 60)).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handlePlayPause}
              className='gap-2'
            >
              {isPlaying ? (
                <>
                  <Pause className='h-4 w-4' />
                  Pausar
                </>
              ) : (
                <>
                  <Play className='h-4 w-4' />
                  Reproducir
                </>
              )}
            </Button>

            {canUpload && (
              <Button
                variant='default'
                size='sm'
                onClick={handleUpload}
                disabled={isUploading}
                className='gap-2 bg-teal-500 hover:bg-teal-600'
              >
                <Upload className='h-4 w-4' />
                {isUploading ? 'Subiendo...' : 'Subir'}
              </Button>
            )}

            {canRetry && (
              <Button
                variant='default'
                size='sm'
                onClick={handleRetry}
                disabled={isRetrying}
                className='gap-2 bg-amber-500 hover:bg-amber-600'
              >
                <RotateCcw className='h-4 w-4' />
                {isRetrying ? 'Reintentando...' : 'Reintentar'}
              </Button>
            )}

            {canDelete && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className='gap-2'
              >
                <Trash2 className='h-4 w-4' />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              {recording.status === 'pending_upload' ||
              recording.status === 'failed' ? (
                <>
                  Esta grabación no ha sido sincronizada. Si la eliminas,
                  perderás los datos permanentemente.
                  <br />
                  <br />
                  ¿Estás seguro de que deseas eliminar esta grabación?
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas eliminar esta grabación?
                  <br />
                  <br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
