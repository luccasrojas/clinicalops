/**
 * Error log viewer component for management panel
 * Requirements: 6.4, 7.5
 */

'use client';

import { useState } from 'react';
import { AlertCircle, Download, Trash2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useErrorLogging } from '../hooks/use-error-logging';
import { ErrorLog } from '../services/error-logging.service';
import { ErrorCategory } from '../utils/error-recovery';
import { getErrorMessage } from '../utils/error-messages';

export function ErrorLogViewer() {
  const {
    getAllLogs,
    getFilteredLogs,
    clearLogs,
    errorStats,
    exportLogs,
  } = useErrorLogging();

  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'error' | 'warning' | 'info' | 'all'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const logs = selectedCategory === 'all' && selectedSeverity === 'all'
    ? getAllLogs()
    : getFilteredLogs({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
      });

  const handleExport = () => {
    const data = exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los registros de errores?')) {
      clearLogs();
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Registro de Errores</h3>
          <p className="text-sm text-muted-foreground">
            {errorStats.totalErrors} errores registrados
            {errorStats.recentErrorCount > 0 && (
              <span className="ml-2 text-destructive">
                ({errorStats.recentErrorCount} en las últimas 24h)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrar Errores</DialogTitle>
              <DialogDescription>
                Filtra los errores por categoría o severidad
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Severidad</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={selectedSeverity === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSeverity('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={selectedSeverity === 'error' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSeverity('error')}
                  >
                    Errores ({errorStats.errorsBySeverity.error})
                  </Button>
                  <Button
                    variant={selectedSeverity === 'warning' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSeverity('warning')}
                  >
                    Advertencias ({errorStats.errorsBySeverity.warning})
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <select
                  className="w-full mt-2 p-2 border rounded"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ErrorCategory | 'all')}
                >
                  <option value="all">Todas las categorías</option>
                  {Object.entries(errorStats.errorsByCategory).map(([category, count]) => (
                    <option key={category} value={category}>
                      {category} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {(selectedCategory !== 'all' || selectedSeverity !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSeverity('all');
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Error logs list */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay errores registrados</p>
          </Card>
        ) : (
          logs.map((log) => (
            <ErrorLogCard
              key={log.id}
              log={log}
              isExpanded={expandedLogId === log.id}
              onToggleExpand={() => toggleExpand(log.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ErrorLogCardProps {
  log: ErrorLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function ErrorLogCard({ log, isExpanded, onToggleExpand }: ErrorLogCardProps) {
  const errorMessage = getErrorMessage(log.category);
  const date = new Date(log.timestamp);

  const severityColors = {
    error: 'destructive',
    warning: 'warning',
    info: 'secondary',
  } as const;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={severityColors[log.severity]}>
              {log.severity === 'error' ? 'Error' : log.severity === 'warning' ? 'Advertencia' : 'Info'}
            </Badge>
            <Badge variant="outline">{log.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleString('es-ES')}
            </span>
          </div>
          <h4 className="font-medium">{errorMessage.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{log.errorMessage}</p>
          
          {isExpanded && (
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <span className="font-medium">Acción:</span> {log.context.action}
              </div>
              {log.context.recordingId && (
                <div>
                  <span className="font-medium">ID de grabación:</span> {log.context.recordingId}
                </div>
              )}
              {log.context.additionalInfo && (
                <div>
                  <span className="font-medium">Información adicional:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.context.additionalInfo, null, 2)}
                  </pre>
                </div>
              )}
              {log.errorStack && (
                <div>
                  <span className="font-medium">Stack trace:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-40">
                    {log.errorStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
