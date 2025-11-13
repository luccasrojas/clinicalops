'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type SaveConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SaveConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: SaveConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guardar Historia Clínica</DialogTitle>
          <DialogDescription>
            ¿Quieres guardar los cambios realizados en la historia clínica?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
          >
            No
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Sí, guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
