/**
 * Performance monitoring service for recording feature
 * Tracks metrics like recording duration, upload success/failure rates,
 * storage usage, and sync queue length
 */

export interface RecordingMetrics {
  recordingStartTime: number
  recordingDuration: number
  saveToIndexedDBTime: number
  uploadStartTime: number
  uploadDuration: number
  uploadSpeed: number // bytes/sec
  retryCount: number
  recordingSize: number // bytes
  mimeType: string
}

export interface UploadMetrics {
  success: boolean
  duration: number // ms
  size: number // bytes
  speed: number // bytes/sec
  retryCount: number
  errorType?: string
  timestamp: number
}

export interface StorageMetrics {
  totalRecordings: number
  pendingCount: number
  syncedCount: number
  failedCount: number
  totalSize: number // bytes
  timestamp: number
}

export interface SyncQueueMetrics {
  queueLength: number
  activeUploads: number
  timestamp: number
}

class PerformanceMonitoringService {
  private recordingMetrics: Map<string, Partial<RecordingMetrics>> = new Map()
  private uploadHistory: UploadMetrics[] = []
  private storageHistory: StorageMetrics[] = []
  private syncQueueHistory: SyncQueueMetrics[] = []

  // Maximum history items to keep in memory
  private readonly MAX_HISTORY_ITEMS = 100

  /**
   * Start tracking a recording session
   */
  startRecording(recordingId: string): void {
    this.recordingMetrics.set(recordingId, {
      recordingStartTime: Date.now(),
    })
    console.log(`[Performance] Recording started: ${recordingId}`)
  }

  /**
   * Track recording completion
   */
  completeRecording(
    recordingId: string,
    duration: number,
    size: number,
    mimeType: string,
  ): void {
    const metrics = this.recordingMetrics.get(recordingId)
    if (metrics) {
      metrics.recordingDuration = duration
      metrics.recordingSize = size
      metrics.mimeType = mimeType
      console.log(`[Performance] Recording completed: ${recordingId}`, {
        duration: `${duration}s`,
        size: `${(size / 1024 / 1024).toFixed(2)}MB`,
        mimeType,
      })
    }
  }

  /**
   * Track IndexedDB save operation
   */
  trackIndexedDBSave(
    recordingId: string,
    startTime: number,
    endTime: number,
  ): void {
    const metrics = this.recordingMetrics.get(recordingId)
    if (metrics) {
      metrics.saveToIndexedDBTime = endTime - startTime
      console.log(`[Performance] IndexedDB save: ${recordingId}`, {
        duration: `${metrics.saveToIndexedDBTime}ms`,
      })
    }
  }

  /**
   * Start tracking an upload
   */
  startUpload(recordingId: string): void {
    const metrics = this.recordingMetrics.get(recordingId)
    if (metrics) {
      metrics.uploadStartTime = Date.now()
      metrics.retryCount = metrics.retryCount || 0
      console.log(`[Performance] Upload started: ${recordingId}`, {
        retryCount: metrics.retryCount,
      })
    }
  }

  /**
   * Track upload completion (success or failure)
   */
  completeUpload(
    recordingId: string,
    success: boolean,
    errorType?: string,
  ): void {
    const metrics = this.recordingMetrics.get(recordingId)
    if (metrics && metrics.uploadStartTime) {
      const uploadDuration = Date.now() - metrics.uploadStartTime
      metrics.uploadDuration = uploadDuration

      if (success && metrics.recordingSize) {
        metrics.uploadSpeed = (metrics.recordingSize / uploadDuration) * 1000 // bytes/sec
      }

      // Add to upload history
      const uploadMetric: UploadMetrics = {
        success,
        duration: uploadDuration,
        size: metrics.recordingSize || 0,
        speed: metrics.uploadSpeed || 0,
        retryCount: metrics.retryCount || 0,
        errorType,
        timestamp: Date.now(),
      }

      this.uploadHistory.push(uploadMetric)

      // Keep only recent history
      if (this.uploadHistory.length > this.MAX_HISTORY_ITEMS) {
        this.uploadHistory.shift()
      }

      console.log(
        `[Performance] Upload ${success ? 'succeeded' : 'failed'}: ${recordingId}`,
        {
          duration: `${uploadDuration}ms`,
          speed: metrics.uploadSpeed
            ? `${(metrics.uploadSpeed / 1024 / 1024).toFixed(2)}MB/s`
            : 'N/A',
          retryCount: metrics.retryCount,
          errorType,
        },
      )

      // Clean up metrics after upload completes
      if (success) {
        this.recordingMetrics.delete(recordingId)
      }
    }
  }

  /**
   * Track upload retry
   */
  trackUploadRetry(recordingId: string): void {
    const metrics = this.recordingMetrics.get(recordingId)
    if (metrics) {
      metrics.retryCount = (metrics.retryCount || 0) + 1
      console.log(`[Performance] Upload retry: ${recordingId}`, {
        retryCount: metrics.retryCount,
      })
    }
  }

  /**
   * Track storage metrics
   */
  trackStorageMetrics(metrics: Omit<StorageMetrics, 'timestamp'>): void {
    const storageMetric: StorageMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.storageHistory.push(storageMetric)

    // Keep only recent history
    if (this.storageHistory.length > this.MAX_HISTORY_ITEMS) {
      this.storageHistory.shift()
    }

    console.log('[Performance] Storage metrics:', {
      totalRecordings: metrics.totalRecordings,
      pending: metrics.pendingCount,
      synced: metrics.syncedCount,
      failed: metrics.failedCount,
      totalSize: `${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`,
    })
  }

  /**
   * Track sync queue metrics
   */
  trackSyncQueue(queueLength: number, activeUploads: number): void {
    const queueMetric: SyncQueueMetrics = {
      queueLength,
      activeUploads,
      timestamp: Date.now(),
    }

    this.syncQueueHistory.push(queueMetric)

    // Keep only recent history
    if (this.syncQueueHistory.length > this.MAX_HISTORY_ITEMS) {
      this.syncQueueHistory.shift()
    }

    console.log('[Performance] Sync queue:', {
      queueLength,
      activeUploads,
    })
  }

  /**
   * Get upload success rate
   */
  getUploadSuccessRate(timeWindowMs?: number): number {
    const now = Date.now()
    const relevantUploads = timeWindowMs
      ? this.uploadHistory.filter((m) => now - m.timestamp < timeWindowMs)
      : this.uploadHistory

    if (relevantUploads.length === 0) {
      return 0
    }

    const successCount = relevantUploads.filter((m) => m.success).length
    return (successCount / relevantUploads.length) * 100
  }

  /**
   * Get average upload speed
   */
  getAverageUploadSpeed(timeWindowMs?: number): number {
    const now = Date.now()
    const relevantUploads = timeWindowMs
      ? this.uploadHistory.filter(
          (m) => now - m.timestamp < timeWindowMs && m.success,
        )
      : this.uploadHistory.filter((m) => m.success)

    if (relevantUploads.length === 0) {
      return 0
    }

    const totalSpeed = relevantUploads.reduce((sum, m) => sum + m.speed, 0)
    return totalSpeed / relevantUploads.length
  }

  /**
   * Get average recording duration
   */
  getAverageRecordingDuration(): number {
    const completedRecordings = Array.from(
      this.recordingMetrics.values(),
    ).filter((m) => m.recordingDuration !== undefined)

    if (completedRecordings.length === 0) {
      return 0
    }

    const totalDuration = completedRecordings.reduce(
      (sum, m) => sum + (m.recordingDuration || 0),
      0,
    )
    return totalDuration / completedRecordings.length
  }

  /**
   * Get current storage usage
   */
  getCurrentStorageUsage(): StorageMetrics | null {
    if (this.storageHistory.length === 0) {
      return null
    }
    return this.storageHistory[this.storageHistory.length - 1]
  }

  /**
   * Get current sync queue status
   */
  getCurrentSyncQueueStatus(): SyncQueueMetrics | null {
    if (this.syncQueueHistory.length === 0) {
      return null
    }
    return this.syncQueueHistory[this.syncQueueHistory.length - 1]
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs: number = 3600000): {
    uploadSuccessRate: number
    averageUploadSpeed: number
    averageRecordingDuration: number
    totalUploads: number
    failedUploads: number
    currentStorage: StorageMetrics | null
    currentSyncQueue: SyncQueueMetrics | null
  } {
    const now = Date.now()
    const recentUploads = this.uploadHistory.filter(
      (m) => now - m.timestamp < timeWindowMs,
    )

    return {
      uploadSuccessRate: this.getUploadSuccessRate(timeWindowMs),
      averageUploadSpeed: this.getAverageUploadSpeed(timeWindowMs),
      averageRecordingDuration: this.getAverageRecordingDuration(),
      totalUploads: recentUploads.length,
      failedUploads: recentUploads.filter((m) => !m.success).length,
      currentStorage: this.getCurrentStorageUsage(),
      currentSyncQueue: this.getCurrentSyncQueueStatus(),
    }
  }

  /**
   * Export metrics for external monitoring/analytics
   */
  exportMetrics(): {
    uploadHistory: UploadMetrics[]
    storageHistory: StorageMetrics[]
    syncQueueHistory: SyncQueueMetrics[]
    summary: ReturnType<typeof this.getPerformanceSummary>
  } {
    return {
      uploadHistory: [...this.uploadHistory],
      storageHistory: [...this.storageHistory],
      syncQueueHistory: [...this.syncQueueHistory],
      summary: this.getPerformanceSummary(),
    }
  }

  /**
   * Clear all metrics (useful for testing or reset)
   */
  clearMetrics(): void {
    this.recordingMetrics.clear()
    this.uploadHistory = []
    this.storageHistory = []
    this.syncQueueHistory = []
    console.log('[Performance] All metrics cleared')
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService()
