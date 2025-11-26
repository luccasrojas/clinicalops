/**
 * Error logging service for recording feature
 * Requirements: 6.4, 7.5
 */

import { ErrorCategory, categorizeError } from '../utils/error-recovery';

export interface ErrorLog {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  context: {
    recordingId?: string;
    action: string;
    userAgent: string;
    url: string;
    additionalInfo?: Record<string, any>;
  };
  severity: 'error' | 'warning' | 'info';
}

export interface ErrorLogFilter {
  category?: ErrorCategory;
  severity?: 'error' | 'warning' | 'info';
  startDate?: Date;
  endDate?: Date;
  recordingId?: string;
}

/**
 * Service for logging and managing error logs
 */
class ErrorLoggingService {
  private readonly STORAGE_KEY = 'clinicalops:error-logs';
  private readonly MAX_LOGS = 100; // Keep last 100 errors
  private readonly LOG_RETENTION_DAYS = 7; // Keep logs for 7 days

  /**
   * Log an error with context
   */
  logError(
    error: unknown,
    context: {
      recordingId?: string;
      action: string;
      additionalInfo?: Record<string, any>;
    }
  ): ErrorLog {
    const category = categorizeError(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      category,
      errorName: errorObj.name,
      errorMessage: errorObj.message,
      errorStack: errorObj.stack,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      },
      severity: this.getSeverity(category),
    };

    // Log to console with context
    this.logToConsole(errorLog);

    // Store in localStorage
    this.storeLog(errorLog);

    return errorLog;
  }

  /**
   * Log to console with formatted output
   */
  private logToConsole(errorLog: ErrorLog): void {
    const { severity, category, errorMessage, context } = errorLog;
    
    const consoleMethod = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    
    console[consoleMethod](
      `[Recording Error] ${category}:`,
      {
        message: errorMessage,
        action: context.action,
        recordingId: context.recordingId,
        timestamp: errorLog.timestamp,
        additionalInfo: context.additionalInfo,
      }
    );

    // Log stack trace for errors
    if (severity === 'error' && errorLog.errorStack) {
      console.error('Stack trace:', errorLog.errorStack);
    }
  }

  /**
   * Store error log in localStorage
   */
  private storeLog(errorLog: ErrorLog): void {
    try {
      const logs = this.getAllLogs();
      logs.push(errorLog);

      // Keep only the most recent logs
      const trimmedLogs = logs.slice(-this.MAX_LOGS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      // If localStorage is full or unavailable, just log to console
      console.error('Failed to store error log:', error);
    }
  }

  /**
   * Get all error logs from localStorage
   */
  getAllLogs(): ErrorLog[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const logs: ErrorLog[] = JSON.parse(stored);
      
      // Filter out old logs
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);
      
      return logs.filter(log => new Date(log.timestamp) > cutoffDate);
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  /**
   * Get filtered error logs
   */
  getFilteredLogs(filter: ErrorLogFilter): ErrorLog[] {
    const logs = this.getAllLogs();

    return logs.filter(log => {
      if (filter.category && log.category !== filter.category) {
        return false;
      }

      if (filter.severity && log.severity !== filter.severity) {
        return false;
      }

      if (filter.recordingId && log.context.recordingId !== filter.recordingId) {
        return false;
      }

      if (filter.startDate && new Date(log.timestamp) < filter.startDate) {
        return false;
      }

      if (filter.endDate && new Date(log.timestamp) > filter.endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get logs for a specific recording
   */
  getLogsForRecording(recordingId: string): ErrorLog[] {
    return this.getFilteredLogs({ recordingId });
  }

  /**
   * Get recent errors (last 24 hours)
   */
  getRecentErrors(): ErrorLog[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.getFilteredLogs({
      startDate: yesterday,
      severity: 'error',
    });
  }

  /**
   * Clear all error logs
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  /**
   * Clear old logs (older than retention period)
   */
  clearOldLogs(): number {
    const logs = this.getAllLogs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);

    const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
    const removedCount = logs.length - recentLogs.length;

    if (removedCount > 0) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentLogs));
      } catch (error) {
        console.error('Failed to clear old logs:', error);
      }
    }

    return removedCount;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<'error' | 'warning' | 'info', number>;
    recentErrorCount: number;
  } {
    const logs = this.getAllLogs();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = {
      totalErrors: logs.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {
        error: 0,
        warning: 0,
        info: 0,
      },
      recentErrorCount: 0,
    };

    logs.forEach(log => {
      // Count by category
      stats.errorsByCategory[log.category] = (stats.errorsByCategory[log.category] || 0) + 1;

      // Count by severity
      stats.errorsBySeverity[log.severity]++;

      // Count recent errors
      if (new Date(log.timestamp) > yesterday) {
        stats.recentErrorCount++;
      }
    });

    return stats;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    const logs = this.getAllLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Generate unique ID for error log
   */
  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get severity level for error category
   */
  private getSeverity(category: ErrorCategory): 'error' | 'warning' | 'info' {
    const errorCategories: ErrorCategory[] = [
      ErrorCategory.PERMISSION_DENIED,
      ErrorCategory.DEVICE_NOT_FOUND,
      ErrorCategory.NOT_SUPPORTED,
      ErrorCategory.QUOTA_EXCEEDED,
      ErrorCategory.STORAGE_ERROR,
      ErrorCategory.SERVER_ERROR,
      ErrorCategory.UNKNOWN,
    ];

    const warningCategories: ErrorCategory[] = [
      ErrorCategory.NETWORK_ERROR,
      ErrorCategory.NETWORK_TIMEOUT,
      ErrorCategory.UPLOAD_FAILED,
      ErrorCategory.PRESIGNED_URL_ERROR,
      ErrorCategory.RECORDING_ERROR,
    ];

    if (errorCategories.includes(category)) {
      return 'error';
    } else if (warningCategories.includes(category)) {
      return 'warning';
    } else {
      return 'info';
    }
  }
}

// Export singleton instance
export const errorLoggingService = new ErrorLoggingService();
