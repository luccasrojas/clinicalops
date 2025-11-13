'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExportMedicalRecord } from '../api/export-medical-record';
import type { JsonValue } from '../types/editor';
import { downloadAsDocx, downloadAsPdf } from '../lib/export-utils';

type ExportMenuProps = {
  historyID: string;
  fallbackData?: JsonValue;
};

export function ExportMenu({ historyID, fallbackData }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const exportMutation = useExportMedicalRecord();

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const result = await exportMutation.mutateAsync({ historyID, format });
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
        setOpen(false);
        return;
      }
    } catch (error) {
      console.error('Export failed, using fallback', error);
    }

    if (fallbackData) {
      if (format === 'pdf') {
        downloadAsPdf(fallbackData, `historia-${historyID}`);
      } else {
        downloadAsDocx(fallbackData, `historia-${historyID}`);
      }
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>

      {open ? (
        <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-lg z-10">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            onClick={() => handleExport('pdf')}
          >
            Exportar PDF
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            onClick={() => handleExport('docx')}
          >
            Exportar DOCX
          </button>
        </div>
      ) : null}
    </div>
  );
}
