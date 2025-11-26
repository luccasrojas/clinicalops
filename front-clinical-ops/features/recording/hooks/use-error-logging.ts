/**
 * React hook for error logging
 * Requirements: 6.4, 7.5
 */

import { useCallback, useEffect, useState } from 'react';
import { errorLoggingService, ErrorLog, ErrorLogFilter } from '../services/error-logging.service';
import { ErrorCategory } from '../utils/error-recovery';

export interface UseErrorLoggingReturn {
  // Logging
  logError: (
    error: unknown,
    context: {
      recordingId?: string;
      action: string;
      additionalInfo?: Record<string, any>;
    }
  ) => ErrorLog;

  // Querying
  getAllLogs: () => ErrorLog[];
  getFilteredLogs: (filter: ErrorLogFilter) => ErrorLog[];
  getLogsForRecording: (recordingId: string) => ErrorLog[];
  getRecentErrors: () => ErrorLog[];

  // Management
  clearLogs: () => void;
  clearOldLogs: () => number;

  // Stats
  errorStats: {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<'error' | 'warning' | 'info', number>;
    recentErrorCount: number;
  };
  refreshStats: () => void;

  // Export
  exportLogs: () => string;
}

/**
 * Hook for error logging functionality
 */
export function useErrorLogging(): UseErrorLoggingReturn {
  const [errorStats, setErrorStats] = useState(() => errorLoggingService.getErrorStats());

  // Refresh stats
  const refreshStats = useCallback(() => {
    setErrorStats(errorLoggingService.getErrorStats());
  }, []);

  // Log error wrapper
  const logError = useCallback(
    (
      error: unknown,
      context: {
        recordingId?: string;
        action: string;
        additionalInfo?: Record<string, any>;
      }
    ) => {
      const errorLog = errorLoggingService.logError(error, context);
      refreshStats();
      return errorLog;
    },
    [refreshStats]
  );

  // Clear logs wrapper
  const clearLogs = useCallback(() => {
    errorLoggingService.clearLogs();
    refreshStats();
  }, [refreshStats]);

  // Clear old logs wrapper
  const clearOldLogs = useCallback(() => {
    const count = errorLoggingService.clearOldLogs();
    refreshStats();
    return count;
  }, [refreshStats]);

  // Auto-refresh stats on mount and periodically
  useEffect(() => {
    refreshStats();

    // Refresh stats every minute
    const interval = setInterval(refreshStats, 60000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    logError,
    getAllLogs: errorLoggingService.getAllLogs.bind(errorLoggingService),
    getFilteredLogs: errorLoggingService.getFilteredLogs.bind(errorLoggingService),
    getLogsForRecording: errorLoggingService.getLogsForRecording.bind(errorLoggingService),
    getRecentErrors: errorLoggingService.getRecentErrors.bind(errorLoggingService),
    clearLogs,
    clearOldLogs,
    errorStats,
    refreshStats,
    exportLogs: errorLoggingService.exportLogs.bind(errorLoggingService),
  };
}
