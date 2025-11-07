'use client';

import { useState, useEffect } from 'react';
import { Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVersionHistory } from '../api/get-version-history';
import { useRestoreVersion } from '../api/restore-version';
import type { VersionEntry } from '../types/api';

type VersionHistoryPanelProps = {
  historyID: string;
  userId?: string | null;
};

export function VersionHistoryPanel({ historyID, userId }: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const { data, refetch, isFetching } = useVersionHistory(historyID, 20, open);
  const restoreMutation = useRestoreVersion();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleRestore = async (version: VersionEntry) => {
    if (!userId) return;
    try {
      await restoreMutation.mutateAsync({
        historyID,
        versionTimestamp: version.versionTimestamp,
        userId,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to restore version', error);
    }
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
        <History className="h-4 w-4 mr-2" />
        Historial
      </Button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-lg border bg-white shadow-xl z-20">
          <div className="p-3 border-b flex items-center justify-between">
            <p className="text-sm font-semibold">Versiones guardadas</p>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
          <div className="p-3 space-y-3 text-sm">
            {isFetching ? (
              <p className="text-muted-foreground">Cargando versiones…</p>
            ) : data?.versions?.length ? (
              data.versions.map((version) => (
                <div
                  key={version.versionTimestamp}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(version.versionTimestamp).toLocaleString('es-ES')}
                    </span>
                    <span>{version.userId}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {version.changeDescription || 'Edición manual'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={restoreMutation.isPending || !userId}
                    onClick={() => handleRestore(version)}
                  >
                    Restaurar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Sin versiones registradas aún.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
