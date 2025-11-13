'use client';

import { useState, useCallback } from 'react';
import type { JsonValue } from '../types/editor';

export function useEditorState(initialValue: JsonValue) {
  const [value, setValue] = useState<JsonValue>(initialValue);

  const updateValue = useCallback((nextValue: JsonValue) => {
    setValue(nextValue);
  }, []);

  const resetValue = useCallback((nextValue: JsonValue) => {
    setValue(nextValue);
  }, []);

  return {
    value,
    updateValue,
    resetValue,
  };
}
