import { useEffect, useCallback, useRef } from 'react';
import { cleanupService, CleanupResult } from '../services/cleanup.service';
import { useRecordingStorage } from './use-recording-storage';

export interface UseCleanupSchedulerOptions {
  /** Whether to run cleanup on app startup */
  runOnStartup?: boolean;
  /** Whether to run cleanup after successful sync */
  runAfterSync?: boolean;
  /** Callback when cleanup completes */
  onCleanupComplete?: (result: CleanupResult) => void;
}

/**
 * Hook to schedule automatic cleanup operations
 * Runs cleanup on app startup, after sync, and when quota warnings are detected
 */
export function useCleanupScheduler(options: UseCleanupSchedulerOptions = {}) {
  const {
    runOnStartup = true,
    runAfterSync = true,
    onCleanupComplete,
  } = options;

  const { isStorageLow } = useRecordingStorage();
  const hasRunStartupCleanup = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform cleanup and notify
   */
  const performCleanup = useCallback(
    async (reason: CleanupResult['reason']) => {
      try {
        const result = await cleanupService.checkAndCleanup(reason);
        
        if (result && onCleanupComplete) {
          onCleanupComplete(result);
        }
      } catch (error) {
        console.error('[CleanupScheduler] Error during cleanup:', error);
      }
    },
    [onCleanupComplete]
  );

  /**
   * Check storage quota and trigger cleanup if needed
   */
  const checkQuotaAndCleanup = useCallback(async () => {
    try {
      const isLow = await isStorageLow();
      
      if (isLow) {
        console.log('[CleanupScheduler] Storage quota low, triggering cleanup');
        await performCleanup('low_storage');
      }
    } catch (error) {
      console.error('[CleanupScheduler] Error checking quota:', error);
    }
  }, [isStorageLow, performCleanup]);

  /**
   * Run cleanup on app startup (once)
   */
  useEffect(() => {
    if (runOnStartup && !hasRunStartupCleanup.current) {
      hasRunStartupCleanup.current = true;
      
      // Delay startup cleanup to not block initial render
      cleanupTimeoutRef.current = setTimeout(() => {
        console.log('[CleanupScheduler] Running startup cleanup check');
        performCleanup('scheduled').catch(error => {
          console.error('[CleanupScheduler] Startup cleanup failed:', error);
        });
      }, 5000); // 5 second delay
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [runOnStartup, performCleanup]);

  /**
   * Expose method to trigger cleanup after sync
   * This should be called by the sync manager after successful sync
   */
  const triggerPostSyncCleanup = useCallback(async () => {
    if (runAfterSync) {
      console.log('[CleanupScheduler] Running post-sync cleanup check');
      await performCleanup('post_sync');
    }
  }, [runAfterSync, performCleanup]);

  /**
   * Expose method to manually trigger cleanup
   */
  const triggerManualCleanup = useCallback(async () => {
    console.log('[CleanupScheduler] Running manual cleanup');
    return await cleanupService.performCleanup('manual');
  }, []);

  return {
    triggerPostSyncCleanup,
    triggerManualCleanup,
    checkQuotaAndCleanup,
  };
}
