'use client';

import { useEffect, useState } from 'react';

type UseSaveShortcutOptions = {
  onSave: () => void;
  enabled?: boolean;
};

export function useSaveShortcut({ onSave, enabled = true }: UseSaveShortcutOptions) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        setShowDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  const handleConfirm = () => {
    onSave();
    setShowDialog(false);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return {
    showDialog,
    setShowDialog,
    handleConfirm,
    handleCancel,
  };
}
