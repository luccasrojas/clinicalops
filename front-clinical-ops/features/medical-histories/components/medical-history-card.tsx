'use client';

import { Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { MedicalHistory } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type MedicalHistoryCardProps = {
  history: MedicalHistory;
  onEdit: (historyID: string) => void;
  onDownload: (historyID: string) => void;
};

export function MedicalHistoryCard({
  history,
  onEdit,
  onDownload,
}: MedicalHistoryCardProps) {
  const diagnosis = String(
    history.metaData?.diagnosis ||
    history.preview?.diagnosis ||
    history.jsonData?.diagnostico ||
    history.jsonData?.diagnosis ||
    'Sin diagnóstico'
  );

  const summary = String(
    history.metaData?.summary || 'Sin resumen disponible'
  );

  const createdDate = history.createdAt
    ? format(new Date(history.createdAt), "d 'de' MMMM, yyyy HH:mm a", {
        locale: es,
      })
    : 'Fecha desconocida';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{diagnosis}</h3>
            <p className="text-sm text-muted-foreground mt-1">{createdDate}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Resumen:</span>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {summary}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center space-x-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(history.historyID)}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onEdit(history.historyID)}
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}
