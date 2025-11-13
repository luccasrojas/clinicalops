'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMedicalHistory } from '../api/get-medical-history';
import type { SingleHistoryResponse } from '../types';
import { TiptapEditor } from '@/features/medical-records-editor/components/tiptap-editor';
import { useMedicalRecord } from '@/features/medical-records-editor/api/get-medical-record';
import { useAutosave } from '@/features/medical-records-editor/hooks/use-autosave';
import { useEditorState } from '@/features/medical-records-editor/hooks/use-editor';
import { useMedicalRecordWebSocket } from '@/features/medical-records-editor/hooks/use-websocket';
import { useSaveShortcut } from '@/features/medical-records-editor/hooks/use-save-shortcut';
import { SaveStatusIndicator } from '@/features/medical-records-editor/components/save-status-indicator';
import { SaveConfirmationDialog } from '@/features/medical-records-editor/components/save-confirmation-dialog';
import { ExportMenu } from '@/features/medical-records-editor/components/export-menu';
import { VersionHistoryPanel } from '@/features/medical-records-editor/components/version-history-panel';
import { ReadOnlyBanner } from '@/features/medical-records-editor/components/read-only-banner';
import type { JsonValue } from '@/features/medical-records-editor/types/editor';
import type { JsonObject } from '@/features/medical-records-editor/services/json-transformer.service';
import { useAuth } from '@/features/auth/hooks/use-auth';

type MedicalHistoryViewerProps = {
  historyID: string;
};

export function MedicalHistoryViewer({ historyID }: MedicalHistoryViewerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.sub || user?.doctorID || user?.username || null;

  const { data: historyData, isLoading, error } = useMedicalHistory(historyID);
  const {
    data: recordData,
    isLoading: recordLoading,
    error: recordError,
  } = useMedicalRecord(historyID);

  const history = (historyData as SingleHistoryResponse | undefined)?.history;
  const structuredNote = recordData?.record?.structuredClinicalNote ?? '{}';
  const structuredNoteOriginal =
    recordData?.record?.structuredClinicalNoteOriginal ?? null;

  // Parse full JSON (includes tipo_historia, especialidad_probable, estructura_historia_clinica)
  const fullNote = useMemo<JsonValue>(() => {
    try {
      const parsed = JSON.parse(structuredNote);
      console.log('[MedicalHistoryViewer] Parsed fullNote:', parsed);
      return parsed;
    } catch (error) {
      console.error('[MedicalHistoryViewer] Failed to parse structuredNote:', error);
      return {};
    }
  }, [structuredNote]);

  const originalFullNote = useMemo<JsonValue>(() => {
    if (!structuredNoteOriginal) {
      return null;
    }

    try {
      const parsed = JSON.parse(structuredNoteOriginal);
      return parsed;
    } catch (error) {
      console.error(
        '[MedicalHistoryViewer] Failed to parse structuredClinicalNoteOriginal:',
        error
      );
      return null;
    }
  }, [structuredNoteOriginal]);

  // Extract ONLY estructura_historia_clinica for editing
  const estructuraHistoriaClinica = useMemo<JsonValue>(() => {
    if (
      fullNote &&
      typeof fullNote === 'object' &&
      !Array.isArray(fullNote) &&
      'estructura_historia_clinica' in fullNote
    ) {
      console.log('[MedicalHistoryViewer] Using estructura_historia_clinica:', fullNote.estructura_historia_clinica);
      return fullNote.estructura_historia_clinica as JsonValue;
    }
    // Fallback: if estructura_historia_clinica doesn't exist, use the whole note
    // This handles legacy data where the structure might be different
    console.log('[MedicalHistoryViewer] Using fallback (fullNote):', fullNote);
    return fullNote || {};
  }, [fullNote]);

  const originalEstructuraClinica = useMemo<JsonValue>(() => {
    if (
      originalFullNote &&
      typeof originalFullNote === 'object' &&
      !Array.isArray(originalFullNote) &&
      'estructura_historia_clinica' in originalFullNote
    ) {
      return originalFullNote.estructura_historia_clinica as JsonValue;
    }
    return originalFullNote || null;
  }, [originalFullNote]);

  const { value, resetValue, updateValue } = useEditorState(estructuraHistoriaClinica);

  useEffect(() => {
    resetValue(estructuraHistoriaClinica);
  }, [estructuraHistoriaClinica, resetValue]);

  const { saveStatus, saveDraft, saveNow } = useAutosave({
    historyID,
    userId,
    initialValue: estructuraHistoriaClinica,
    fullNote: fullNote, // Pass full JSON for metadata preservation
    changeDescription: 'Edición del médico',
  });

  useMedicalRecordWebSocket({
    historyID,
    userId,
    onMessage: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-record', historyID] });
    },
  });

  const handleChange = (nextValue: JsonValue) => {
    updateValue(nextValue);
    saveDraft(nextValue);
  };

  // Extract readOnly early to use in hooks
  const readOnly = recordData?.record?.readOnly ?? false;

  // Manual save with Ctrl+S confirmation (immediate, no debounce)
  const handleManualSave = () => {
    if (readOnly) return;
    saveNow(value);
  };

  const { showDialog, setShowDialog, handleConfirm, handleCancel } = useSaveShortcut({
    onSave: handleManualSave,
    enabled: !readOnly,
  });

  if (isLoading || recordLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || recordError || !history || !recordData?.record) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          Error al cargar la historia clínica: {error?.message || recordError?.message || 'Error desconocido'}
        </p>
      </div>
    );
  }

  const record = recordData.record;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Historia Clínica</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {record.patientName || history.metaData?.patientName || 'Paciente'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <SaveStatusIndicator status={saveStatus} />
          <ExportMenu historyID={historyID} fallbackData={value} />
          <VersionHistoryPanel historyID={historyID} userId={userId} />
          {readOnly ? (
            <Button variant="ghost" size="sm" disabled className="text-xs">
              Solo lectura
            </Button>
          ) : null}
        </div>
      </div>

      {readOnly ? <ReadOnlyBanner /> : null}

      <TiptapEditor
        value={typeof value === 'object' && !Array.isArray(value) && value !== null ? value : {}}
        lockedStructure={
          originalEstructuraClinica &&
          typeof originalEstructuraClinica === 'object' &&
          !Array.isArray(originalEstructuraClinica)
            ? (originalEstructuraClinica as JsonObject)
            : undefined
        }
        onChange={handleChange}
        readOnly={readOnly}
      />

      <SaveConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <Card>
        <CardHeader>
          <CardTitle>Información del Registro</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Paciente</span>
            <p className="text-muted-foreground">
              {record.patientName || 'No disponible'}
            </p>
          </div>
          <div>
            <span className="font-medium">Última edición</span>
            <p className="text-muted-foreground">
              {record.lastEditedAt
                ? new Date(record.lastEditedAt).toLocaleString('es-ES')
                : 'Sin cambios'}
            </p>
          </div>
          <div>
            <span className="font-medium">Creado</span>
            <p className="text-muted-foreground">
              {record.createdAt
                ? new Date(record.createdAt).toLocaleString('es-ES')
                : 'N/D'}
            </p>
          </div>
          <div>
            <span className="font-medium">Estado</span>
            <p className="text-muted-foreground capitalize">
              {record.status || history.status || 'N/D'}
            </p>
          </div>
          <div>
            <span className="font-medium">ID del registro</span>
            <p className="text-muted-foreground font-mono">{historyID}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
