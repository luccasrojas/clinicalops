import { create } from 'zustand';
import type { JsonValue } from '../types/editor';

type EditorStore = {
  currentValue: JsonValue | null;
  initialValue: JsonValue | null;
  readOnly: boolean;
  lastRemoteUpdate?: number;
  setInitialValue: (value: JsonValue) => void;
  setCurrentValue: (value: JsonValue) => void;
  setReadOnly: (value: boolean) => void;
  markRemoteUpdate: () => void;
};

export const useEditorStore = create<EditorStore>((set) => ({
  currentValue: null,
  initialValue: null,
  readOnly: false,
  lastRemoteUpdate: undefined,
  setInitialValue: (value) =>
    set({
      initialValue: value,
      currentValue: value,
    }),
  setCurrentValue: (value) => set({ currentValue: value }),
  setReadOnly: (value) => set({ readOnly: value }),
  markRemoteUpdate: () => set({ lastRemoteUpdate: Date.now() }),
}));
