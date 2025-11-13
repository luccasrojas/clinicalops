import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

export function ReadOnlyBanner() {
  return (
    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
      <AlertDescription className="flex items-center gap-2 text-sm">
        <Lock className="h-4 w-4" />
        Esta historia clínica está en modo solo lectura.
      </AlertDescription>
    </Alert>
  );
}
