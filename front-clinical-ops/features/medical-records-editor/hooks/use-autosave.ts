'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import isEqual from 'lodash.isequal';
import type { JsonValue } from '../types/editor';
import { useUpdateMedicalRecord } from '../api/update-medical-record';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseAutosaveOptions = {
  historyID: string;
  userId?: string | null;
  initialValue: JsonValue;
  fullNote: JsonValue;
  changeDescription?: string;
};

const isObject = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function useAutosave({
  historyID,
  userId,
  initialValue,
  fullNote,
  changeDescription = 'Edición manual',
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const updateMutation = useUpdateMedicalRecord();
  const lastSavedRef = useRef<JsonValue>(initialValue);
  const fullNoteRef = useRef<JsonValue>(fullNote);

  useEffect(() => {
    lastSavedRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    fullNoteRef.current = fullNote;
  }, [fullNote]);

  const debouncedSave = useDebouncedCallback(
    async (nextValue: JsonValue) => {
      if (!historyID || !userId) return;
      if (isEqual(nextValue, lastSavedRef.current)) return;

      setStatus('saving');
      try {
        // Only send estructuraClinica - Lambda will merge it correctly
        await updateMutation.mutateAsync({
          historyID,
          estructuraClinica: JSON.stringify(nextValue),
          userId,
          changeDescription,
        });
        lastSavedRef.current = nextValue;

        // Update fullNoteRef with merged structure
        const updatedFullNote = isObject(fullNoteRef.current)
          ? { ...fullNoteRef.current, estructura_historia_clinica: nextValue }
          : { estructura_historia_clinica: nextValue };
        fullNoteRef.current = updatedFullNote;

        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      } catch (error) {
        console.error('Autosave failed', error);
        setStatus('error');
      }
    },
    30000, // Auto-save every 30 seconds
    { leading: false }
  );

  return {
    saveStatus: status,
    saveDraft: debouncedSave,
    isSaving: status === 'saving',
  };
}
