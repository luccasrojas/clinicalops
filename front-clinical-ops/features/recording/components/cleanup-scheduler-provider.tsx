'use client';

import { useEffect } from 'react';
import { useCleanupScheduler } from '../hooks/use-cleanup-scheduler';
import { CleanupResult } from '../services/cleanup.service';

/**
 * Provider component that initializes the cleanup scheduler
 * Should be mounted at the app level to run cleanup on startup
 */
export function CleanupSchedulerProvider({ children }: { children: React.ReactNode }) {
  const { triggerPostSyncCleanup } = useCleanupScheduler({
    runOnStartup: true,
    runAfterSync: true,
    onCleanupComplete: (result: CleanupResult) => {
      if (result.deletedCount > 0) {
        const spaceMB = (result.spaceFreed / (1024 * 1024)).toFixed(2);
        console.log(
          `[Cleanup] Removed ${result.deletedCount} old recordings, freed ${spaceMB} MB`
        );
      }
    },
  });

  // Make cleanup trigger available globally for sync manager
  useEffect(() => {
    // Store cleanup trigger in window for access by sync manager
    if (typeof window !== 'undefined') {
      (window as any).__cleanupTrigger = triggerPostSyncCleanup;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__cleanupTrigger;
      }
    };
  }, [triggerPostSyncCleanup]);

  return <>{children}</>;
}
