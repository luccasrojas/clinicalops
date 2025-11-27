'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isOnline: boolean
  onSaveAndTranscribe: () => void
  onSaveLocally: () => void
  onCancel: () => void
}

export function SyncDialog({
  open,
  onOpenChange,
  isOnline,
  onSaveAndTranscribe,
  onSaveLocally,
  onCancel,
}: SyncDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='sm:max-w-[425px]'
        aria-describedby={
          isOnline ? 'sync-dialog-description' : 'offline-dialog-description'
        }
      >
        <DialogHeader>
          <DialogTitle>
            {isOnline
              ? '¿Deseas guardar y transcribir esta grabación?'
              : 'No hay conexión a internet'}
          </DialogTitle>
          {!isOnline && (
            <DialogDescription id='offline-dialog-description'>
              No es posible transcribir la grabación sin conexión a internet.
              Puedes guardarla localmente y transcribirla más tarde cuando
              tengas conexión.
            </DialogDescription>
          )}
          {isOnline && (
            <DialogDescription id='sync-dialog-description' className='sr-only'>
              Elige cómo deseas procesar tu grabación
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className='flex-col gap-2 sm:flex-col sm:space-x-0'>
          {isOnline && (
            <Button
              onClick={onSaveAndTranscribe}
              className='w-full'
              aria-label='Guardar y transcribir la grabación'
            >
              Guardar y Transcribir
            </Button>
          )}
          <Button
            onClick={onSaveLocally}
            variant='outline'
            className='w-full'
            aria-label='Guardar la grabación localmente sin transcribir'
          >
            Guardar Localmente
          </Button>
          <Button
            onClick={onCancel}
            variant='ghost'
            className='w-full'
            aria-label='Cancelar y volver a la grabación'
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
