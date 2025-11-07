import { AlertCircle, Check, Loader2 } from 'lucide-react';
import type { SaveStatus } from '../hooks/use-autosave';

type SaveStatusIndicatorProps = {
  status: SaveStatus;
};

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return (
      <span className="text-xs text-muted-foreground" aria-live="polite">
        Cambios al día
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="assertive">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Guardando…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600" aria-live="polite">
        <Check className="h-3.5 w-3.5" />
        Guardado
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-red-600" aria-live="assertive">
      <AlertCircle className="h-3.5 w-3.5" />
      Error al guardar
    </span>
  );
}
