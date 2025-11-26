'use client'

import { useEffect, useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRecordingStorage } from '../hooks/use-recording-storage'
import { RecordingRecord } from '../services/recording-storage.service'

type CleanupDialogProps = {
  onCleanupComplete?: () => void
}

export function CleanupDialog({ onCleanupComplete }: CleanupDialogProps) {
  const { getCleanupEligibleRecordings, cleanupSyncedRecordings } = useRecordingStorage()
  const [isOpen, setIsOpen] = useState(false)
  const [eligibleRecordings, setEligibleRecordings] = useState<RecordingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [olderThanDays] = useState(7) // Default to 7 days as per requirements

  useEffect(() => {
    if (isOpen) {
      loadEligibleRecordings()
    }
  }, [isOpen])

  const loadEligibleRecordings = async () => {
    setIsLoading(true)
    try {
      const recordings = await getCleanupEligibleRecordings(olderThanDays)
      setEligibleRecordings(recordings)
    } catch (error) {
      console.error('Error loading eligible recordings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    setIsCleaning(true)
    try {
      const deletedCount = await cleanupSyncedRecordings(olderThanDays)
      console.log(`Cleaned up ${deletedCount} recordings`)
      setIsOpen(false)
      if (onCleanupComplete) {
        onCleanupComplete()
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    } finally {
      setIsCleaning(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const totalSpaceToFree = eligibleRecordings.reduce((sum, r) => sum + r.size, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Trash2 className='h-4 w-4' />
          Limpiar Almacenamiento
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Limpiar Almacenamiento</DialogTitle>
          <DialogDescription>
            Elimina grabaciones sincronizadas antiguas para liberar espacio
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500' />
          </div>
        ) : eligibleRecordings.length === 0 ? (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>
              No hay grabaciones sincronizadas mayores a {olderThanDays} días para eliminar
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Summary */}
            <div className='flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
              <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5 shrink-0' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                  Se eliminarán {eligibleRecordings.length} grabación
                  {eligibleRecordings.length !== 1 ? 'es' : ''}
                </p>
                <p className='text-sm text-amber-700 dark:text-amber-300 mt-1'>
                  Espacio a liberar: {formatBytes(totalSpaceToFree)}
                </p>
              </div>
            </div>

            {/* List of recordings to delete */}
            <div className='space-y-2 max-h-[300px] overflow-y-auto'>
              <p className='text-sm font-medium mb-2'>
                Grabaciones que se eliminarán:
              </p>
              {eligibleRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className='flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{recording.fileName}</p>
                    <p className='text-xs text-muted-foreground'>
                      Sincronizado:{' '}
                      {recording.syncedAt
                        ? new Date(recording.syncedAt).toLocaleDateString('es-ES')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className='text-right ml-4 shrink-0'>
                    <p className='text-xs text-muted-foreground'>
                      {formatBytes(recording.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div className='p-3 bg-muted rounded-md'>
              <p className='text-xs text-muted-foreground'>
                Solo se eliminarán grabaciones que ya han sido sincronizadas exitosamente
                con el servidor. Las grabaciones pendientes o fallidas no se eliminarán.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setIsOpen(false)}
            disabled={isCleaning}
          >
            Cancelar
          </Button>
          {eligibleRecordings.length > 0 && (
            <Button
              variant='destructive'
              onClick={handleCleanup}
              disabled={isCleaning}
              className='gap-2'
            >
              <Trash2 className='h-4 w-4' />
              {isCleaning ? 'Limpiando...' : 'Limpiar Ahora'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
