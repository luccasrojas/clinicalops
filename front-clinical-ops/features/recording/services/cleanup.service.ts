import { recordingStorageService } from './recording-storage.service';

/**
 * Configuration for automatic cleanup
 */
export interface CleanupConfig {
  /** Minimum age in days for synced recordings to be eligible for cleanup */
  minAgeDays: number;
  /** Storage threshold in bytes - cleanup triggers when available space is below this */
  storageThresholdBytes: number;
  /** Whether to enable automatic cleanup */
  enabled: boolean;
}

/**
 * Result of a cleanup operation
 */
export interface CleanupResult {
  /** Number of recordings deleted */
  deletedCount: number;
  /** Space freed in bytes */
  spaceFreed: number;
  /** Timestamp of cleanup */
  timestamp: string;
  /** Reason for cleanup */
  reason: 'manual' | 'low_storage' | 'scheduled' | 'post_sync';
}

const DEFAULT_CONFIG: CleanupConfig = {
  minAgeDays: 7,
  storageThresholdBytes: 100 * 1024 * 1024, // 100MB
  enabled: true,
};

/**
 * Service for automatic cleanup of old synced recordings
 * Implements background cleanup with configurable policies
 */
export class CleanupService {
  private config: CleanupConfig;
  private lastCleanup: string | null = null;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLastCleanupTime();
  }

  /**
   * Load last cleanup time from localStorage
   */
  private loadLastCleanupTime(): void {
    try {
      const stored = localStorage.getItem('clinicalops:cleanup:last-run');
      if (stored) {
        this.lastCleanup = stored;
      }
    } catch (error) {
      console.error('Error loading last cleanup time:', error);
    }
  }

  /**
   * Save last cleanup time to localStorage
   */
  private saveLastCleanupTime(timestamp: string): void {
    try {
      localStorage.setItem('clinicalops:cleanup:last-run', timestamp);
      this.lastCleanup = timestamp;
    } catch (error) {
      console.error('Error saving last cleanup time:', error);
    }
  }

  /**
   * Check if storage is low and cleanup is needed
   */
  async shouldCleanup(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const isLow = await recordingStorageService.isStorageLow(
        this.config.storageThresholdBytes
      );
      return isLow;
    } catch (error) {
      console.error('Error checking if cleanup needed:', error);
      return false;
    }
  }

  /**
   * Perform cleanup of old synced recordings
   * Only deletes synced recordings older than minAgeDays
   * Never deletes unsynced recordings
   */
  async performCleanup(
    reason: CleanupResult['reason'] = 'scheduled'
  ): Promise<CleanupResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Get recordings eligible for cleanup
      const eligibleRecordings = await recordingStorageService.getCleanupEligibleRecordings(
        this.config.minAgeDays
      );

      // Calculate space that will be freed
      const spaceFreed = eligibleRecordings.reduce(
        (total, recording) => total + recording.size,
        0
      );

      // Delete eligible recordings
      const deletedCount = await recordingStorageService.cleanupSyncedRecordings(
        this.config.minAgeDays
      );

      // Save cleanup time
      this.saveLastCleanupTime(timestamp);

      // Log cleanup operation
      this.logCleanup({
        deletedCount,
        spaceFreed,
        timestamp,
        reason,
      });

      return {
        deletedCount,
        spaceFreed,
        timestamp,
        reason,
      };
    } catch (error) {
      console.error('Error performing cleanup:', error);
      throw error;
    }
  }

  /**
   * Check storage and perform cleanup if needed
   * This is the main method called by the scheduler
   */
  async checkAndCleanup(
    reason: CleanupResult['reason'] = 'scheduled'
  ): Promise<CleanupResult | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const shouldClean = await this.shouldCleanup();
      
      if (shouldClean) {
        console.log(`[CleanupService] Storage low, performing cleanup (${reason})`);
        return await this.performCleanup(reason);
      }

      return null;
    } catch (error) {
      console.error('Error in checkAndCleanup:', error);
      return null;
    }
  }

  /**
   * Log cleanup operation for debugging
   */
  private logCleanup(result: CleanupResult): void {
    const spaceMB = (result.spaceFreed / (1024 * 1024)).toFixed(2);
    console.log(
      `[CleanupService] Cleanup completed:`,
      `\n  Reason: ${result.reason}`,
      `\n  Deleted: ${result.deletedCount} recordings`,
      `\n  Space freed: ${spaceMB} MB`,
      `\n  Timestamp: ${result.timestamp}`
    );
  }

  /**
   * Get last cleanup time
   */
  getLastCleanupTime(): string | null {
    return this.lastCleanup;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CleanupConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();
