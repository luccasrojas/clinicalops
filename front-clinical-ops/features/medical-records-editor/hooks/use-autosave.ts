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
  changeDescription?: string;
};

export function useAutosave({
  historyID,
  userId,
  initialValue,
  changeDescription = 'Edición manual',
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const updateMutation = useUpdateMedicalRecord();
  const lastSavedRef = useRef<JsonValue>(initialValue);

  useEffect(() => {
    lastSavedRef.current = initialValue;
  }, [initialValue]);

  const debouncedSave = useDebouncedCallback(
    async (nextValue: JsonValue) => {
      if (!historyID || !userId) return;
      if (isEqual(nextValue, lastSavedRef.current)) return;

      setStatus('saving');
      try {
        await updateMutation.mutateAsync({
          historyID,
          structuredClinicalNote: JSON.stringify(nextValue),
          userId,
          changeDescription,
        });
        lastSavedRef.current = nextValue;
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      } catch (error) {
        console.error('Autosave failed', error);
        setStatus('error');
      }
    },
    1000,
    { leading: false }
  );

  return {
    saveStatus: status,
    saveDraft: debouncedSave,
    isSaving: status === 'saving',
  };
}
