import { useCallback, useEffect, useState } from 'react'
import {
  recordingStorageService,
  RecordingRecord,
  RecordingStatus,
  StorageStats,
} from '../services/recording-storage.service'
import { performanceMonitoringService } from '../services/performance-monitoring.service'

export interface UseRecordingStorageReturn {
  // Save operations
  saveRecording: (
    data: Omit<RecordingRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string>

  // Query operations
  getRecording: (id: string) => Promise<RecordingRecord | null>
  getAllRecordings: () => Promise<RecordingRecord[]>
  getRecordingsByStatus: (status: RecordingStatus) => Promise<RecordingRecord[]>
  getPendingRecordings: () => Promise<RecordingRecord[]>

  // Update operations
  updateRecordingStatus: (
    id: string,
    status: RecordingStatus,
    updates?: Partial<RecordingRecord>,
  ) => Promise<void>

  // Delete operations
  deleteRecording: (id: string) => Promise<void>

  // Storage stats
  storageStats: StorageStats | null
  refreshStorageStats: () => Promise<void>

  // Cleanup operations
  cleanupSyncedRecordings: (olderThanDays: number) => Promise<number>
  getCleanupEligibleRecordings: (
    olderThanDays: number,
  ) => Promise<RecordingRecord[]>

  // Storage quota
  estimateQuota: () => Promise<{ usage: number; quota: number }>
  isStorageLow: (thresholdBytes?: number) => Promise<boolean>

  // Loading state
  isLoading: boolean
  error: Error | null
}

/**
 * React hook wrapper for RecordingStorageService
 * Provides real-time storage stats and convenient methods for managing recordings
 */
export function useRecordingStorage(): UseRecordingStorageReturn {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refresh storage stats
  const refreshStorageStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await recordingStorageService.getStorageStats()
      setStorageStats(stats)

      // Track storage metrics for performance monitoring
      performanceMonitoringService.trackStorageMetrics({
        totalRecordings: stats.totalRecordings,
        pendingCount: stats.pendingCount,
        syncedCount: stats.syncedCount,
        failedCount: stats.failedCount,
        totalSize: stats.totalSize,
      })
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to get storage stats')
      setError(error)
      console.error('Error refreshing storage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load initial stats on mount
  useEffect(() => {
    refreshStorageStats()
  }, [refreshStorageStats])

  // Save recording wrapper
  const saveRecording = useCallback(
    async (data: Omit<RecordingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null)
        const id = await recordingStorageService.saveRecording(data)
        // Refresh stats after save
        await refreshStorageStats()
        return id
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to save recording')
        setError(error)
        throw error
      }
    },
    [refreshStorageStats],
  )

  // Get recording wrapper
  const getRecording = useCallback(async (id: string) => {
    try {
      setError(null)
      return await recordingStorageService.getRecording(id)
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to get recording')
      setError(error)
      throw error
    }
  }, [])

  // Get all recordings wrapper
  const getAllRecordings = useCallback(async () => {
    try {
      setError(null)
      return await recordingStorageService.getAllRecordings()
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to get all recordings')
      setError(error)
      throw error
    }
  }, [])

  // Get recordings by status wrapper
  const getRecordingsByStatus = useCallback(async (status: RecordingStatus) => {
    try {
      setError(null)
      return await recordingStorageService.getRecordingsByStatus(status)
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to get recordings by status')
      setError(error)
      throw error
    }
  }, [])

  // Get pending recordings wrapper
  const getPendingRecordings = useCallback(async () => {
    try {
      setError(null)
      return await recordingStorageService.getPendingRecordings()
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to get pending recordings')
      setError(error)
      throw error
    }
  }, [])

  // Update recording status wrapper
  const updateRecordingStatus = useCallback(
    async (
      id: string,
      status: RecordingStatus,
      updates?: Partial<RecordingRecord>,
    ) => {
      try {
        setError(null)
        await recordingStorageService.updateRecordingStatus(id, status, updates)
        // Refresh stats after update
        await refreshStorageStats()
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to update recording status')
        setError(error)
        throw error
      }
    },
    [refreshStorageStats],
  )

  // Delete recording wrapper
  const deleteRecording = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await recordingStorageService.deleteRecording(id)
        // Refresh stats after delete
        await refreshStorageStats()
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to delete recording')
        setError(error)
        throw error
      }
    },
    [refreshStorageStats],
  )

  // Cleanup synced recordings wrapper
  const cleanupSyncedRecordings = useCallback(
    async (olderThanDays: number) => {
      try {
        setError(null)
        const deletedCount =
          await recordingStorageService.cleanupSyncedRecordings(olderThanDays)
        // Refresh stats after cleanup
        await refreshStorageStats()
        return deletedCount
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to cleanup recordings')
        setError(error)
        throw error
      }
    },
    [refreshStorageStats],
  )

  // Get cleanup eligible recordings wrapper
  const getCleanupEligibleRecordings = useCallback(
    async (olderThanDays: number) => {
      try {
        setError(null)
        return await recordingStorageService.getCleanupEligibleRecordings(
          olderThanDays,
        )
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to get cleanup eligible recordings')
        setError(error)
        throw error
      }
    },
    [],
  )

  // Estimate quota wrapper
  const estimateQuota = useCallback(async () => {
    try {
      setError(null)
      return await recordingStorageService.estimateQuota()
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to estimate quota')
      setError(error)
      throw error
    }
  }, [])

  // Check if storage is low wrapper
  const isStorageLow = useCallback(async (thresholdBytes?: number) => {
    try {
      setError(null)
      return await recordingStorageService.isStorageLow(thresholdBytes)
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to check storage')
      setError(error)
      throw error
    }
  }, [])

  return {
    saveRecording,
    getRecording,
    getAllRecordings,
    getRecordingsByStatus,
    getPendingRecordings,
    updateRecordingStatus,
    deleteRecording,
    storageStats,
    refreshStorageStats,
    cleanupSyncedRecordings,
    getCleanupEligibleRecordings,
    estimateQuota,
    isStorageLow,
    isLoading,
    error,
  }
}
