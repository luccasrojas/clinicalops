import { useState, useEffect, useCallback, useRef } from 'react'
import { useNetworkStatus } from './use-network-status'
import { useRecordingStorage } from './use-recording-storage'
import { RecordingRecord } from '../services/recording-storage.service'
import { generatePresignedUrl } from '../api/generate-presigned-url'
import { createHistoryFromRecording } from '../api/create-history-from-recording'
import { errorLoggingService } from '../services/error-logging.service'
import { performanceMonitoringService } from '../services/performance-monitoring.service'

export interface SyncProgress {
  current: number
  total: number
  currentRecordingProgress: number
}

export interface SyncEvent {
  type:
    | 'sync_started'
    | 'sync_completed'
    | 'sync_failed'
    | 'recording_synced'
    | 'recording_failed'
  recordingId?: string
  historyID?: string
  error?: string
  totalSynced?: number
  totalFailed?: number
}

export interface UseSyncManagerReturn {
  isSyncing: boolean
  syncProgress: SyncProgress
  pendingCount: number
  failedCount: number
  syncAll: () => Promise<void>
  syncRecording: (id: string) => Promise<void>
  cancelSync: () => void
  retryFailed: () => Promise<void>
}

export interface SyncManagerOptions {
  autoSync?: boolean
  maxConcurrent?: number
  retryAttempts?: number
  retryDelay?: number // ms
  onSyncEvent?: (event: SyncEvent) => void
  onSyncComplete?: () => void | Promise<void>
}

interface UploadTask {
  recordingId: string
  abortController: AbortController
  promise: Promise<void>
}

const DEFAULT_OPTIONS: Omit<Required<SyncManagerOptions>, 'onSyncEvent'> = {
  autoSync: true,
  maxConcurrent: 2,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
}

/**
 * Hook to manage automatic synchronization of recordings
 * Implements queue-based upload with exponential backoff and concurrent uploads
 */
export function useSyncManager(
  options: SyncManagerOptions = {},
): UseSyncManagerReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const { isOnline } = useNetworkStatus()
  const {
    getPendingRecordings,
    getRecordingsByStatus,
    getRecording,
    updateRecordingStatus,
    refreshStorageStats,
  } = useRecordingStorage()

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    currentRecordingProgress: 0,
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  // Track active upload tasks
  const activeTasksRef = useRef<Map<string, UploadTask>>(new Map())
  const queueRef = useRef<string[]>([])
  const isSyncingRef = useRef(false)

  /**
   * Update counts from storage
   */
  const updateCounts = useCallback(async () => {
    try {
      const [pending, failed] = await Promise.all([
        getPendingRecordings(),
        getRecordingsByStatus('failed'),
      ])
      setPendingCount(pending.length)
      setFailedCount(failed.length)
    } catch (error) {
      console.error('Error updating counts:', error)
    }
  }, [getPendingRecordings, getRecordingsByStatus])

  /**
   * Calculate exponential backoff delay
   */
  const getBackoffDelay = (attempt: number): number => {
    return opts.retryDelay * Math.pow(2, attempt)
  }

  /**
   * Upload a single recording with retry logic
   */
  const uploadRecording = async (
    recordingId: string,
    abortSignal: AbortSignal,
  ): Promise<void> => {
    const recording = await getRecording(recordingId)
    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`)
    }

    let lastError: Error | null = null
    const maxAttempts = opts.retryAttempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if cancelled
      if (abortSignal.aborted) {
        throw new Error('Upload cancelled')
      }

      try {
        // Update status to uploading on first attempt
        if (attempt === 0) {
          await updateRecordingStatus(recordingId, 'uploading', {
            syncAttempts: recording.syncAttempts + 1,
            lastSyncAttempt: new Date().toISOString(),
          })

          // Track upload start
          performanceMonitoringService.startUpload(recordingId)
        } else {
          // Track retry
          performanceMonitoringService.trackUploadRetry(recordingId)
        }

        // Step 1: Generate presigned URL
        const presignedData = await generatePresignedUrl({
          doctorID: recording.doctorID,
          fileName: recording.fileName,
          contentType: recording.mimeType,
        })

        if (abortSignal.aborted) {
          throw new Error('Upload cancelled')
        }

        // Step 2: Upload blob to S3 using presigned URL
        const uploadResponse = await fetch(presignedData.uploadURL, {
          method: 'PUT',
          body: recording.blob,
          headers: {
            'Content-Type': recording.mimeType,
          },
          signal: abortSignal,
        })

        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.statusText}`)
        }

        if (abortSignal.aborted) {
          throw new Error('Upload cancelled')
        }

        // Step 3: Create medical history from recording
        const recordingURL = presignedData.uploadURL.split('?')[0] // Remove query params
        const historyResponse = await createHistoryFromRecording({
          doctorID: recording.doctorID,
          recordingURL,
          patientID: recording.metadata.patientID,
        })

        // Step 4: Update recording status to synced
        await updateRecordingStatus(recordingId, 'synced', {
          syncedAt: new Date().toISOString(),
          historyID: historyResponse.history.historyID,
          errorMessage: null,
        })

        // Track successful upload
        performanceMonitoringService.completeUpload(recordingId, true)

        // Emit success event
        if (opts.onSyncEvent) {
          opts.onSyncEvent({
            type: 'recording_synced',
            recordingId,
            historyID: historyResponse.history.historyID,
          })
        }

        // Success - exit retry loop
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        // Log error
        errorLoggingService.logError(error, {
          recordingId,
          action: 'uploadRecording',
          additionalInfo: {
            attempt: attempt + 1,
            maxAttempts,
            recordingSize: recording.size,
            mimeType: recording.mimeType,
          },
        })

        // Don't retry if cancelled or if it's the last attempt
        if (abortSignal.aborted || attempt === maxAttempts - 1) {
          break
        }

        // Wait with exponential backoff before retrying
        const delay = getBackoffDelay(attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // All attempts failed
    const errorMessage =
      lastError?.message || 'Upload failed after multiple attempts'
    await updateRecordingStatus(recordingId, 'failed', {
      errorMessage,
      lastSyncAttempt: new Date().toISOString(),
    })

    // Track failed upload
    performanceMonitoringService.completeUpload(
      recordingId,
      false,
      lastError?.name || 'UnknownError',
    )

    // Emit failure event
    if (opts.onSyncEvent) {
      opts.onSyncEvent({
        type: 'recording_failed',
        recordingId,
        error: errorMessage,
      })
    }

    throw lastError || new Error('Upload failed')
  }

  /**
   * Process the upload queue
   */
  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) {
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    // Emit sync started event
    if (opts.onSyncEvent) {
      opts.onSyncEvent({
        type: 'sync_started',
      })
    }

    let totalSynced = 0
    let totalFailed = 0

    try {
      while (queueRef.current.length > 0) {
        // Check if we should stop (offline)
        if (!isOnline) {
          break
        }

        // Get next batch of recordings to upload (up to maxConcurrent)
        const batch: string[] = []
        while (
          batch.length < opts.maxConcurrent &&
          queueRef.current.length > 0
        ) {
          const recordingId = queueRef.current.shift()
          if (recordingId) {
            batch.push(recordingId)
          }
        }

        if (batch.length === 0) {
          break
        }

        // Update progress
        setSyncProgress((prev) => ({
          ...prev,
          total: prev.total,
          current: prev.total - queueRef.current.length - batch.length,
        }))

        // Track sync queue metrics
        performanceMonitoringService.trackSyncQueue(
          queueRef.current.length,
          batch.length,
        )

        // Start uploads for this batch
        const uploadPromises = batch.map((recordingId) => {
          const abortController = new AbortController()
          const promise = uploadRecording(
            recordingId,
            abortController.signal,
          ).finally(() => {
            activeTasksRef.current.delete(recordingId)
          })

          activeTasksRef.current.set(recordingId, {
            recordingId,
            abortController,
            promise,
          })

          return promise
        })

        // Wait for all uploads in this batch to complete
        const results = await Promise.allSettled(uploadPromises)

        // Count successes and failures
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            totalSynced++
          } else {
            totalFailed++
          }
        })

        // Update progress
        setSyncProgress((prev) => ({
          ...prev,
          current: prev.total - queueRef.current.length,
        }))
      }

      // Emit completion event
      if (opts.onSyncEvent) {
        if (totalFailed > 0) {
          opts.onSyncEvent({
            type: 'sync_failed',
            totalSynced,
            totalFailed,
          })
        } else if (totalSynced > 0) {
          opts.onSyncEvent({
            type: 'sync_completed',
            totalSynced,
          })
        }
      }

      // Trigger post-sync callback (for cleanup)
      if (totalSynced > 0 && opts.onSyncComplete) {
        await opts.onSyncComplete()
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)

      // Reset progress
      setSyncProgress({
        current: 0,
        total: 0,
        currentRecordingProgress: 0,
      })

      // Update counts and refresh storage stats
      await updateCounts()
      await refreshStorageStats()
    }
  }, [
    isOnline,
    opts.maxConcurrent,
    opts.onSyncComplete,
    updateCounts,
    refreshStorageStats,
  ])

  /**
   * Sync all pending recordings
   */
  const syncAll = useCallback(async () => {
    if (isSyncingRef.current) {
      return
    }

    try {
      // Get all pending recordings sorted by creation date (oldest first)
      const pending = await getPendingRecordings()
      const sortedRecordings = pending.sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )

      // Add to queue
      queueRef.current = sortedRecordings.map((r) => r.id)

      // Update progress
      setSyncProgress({
        current: 0,
        total: sortedRecordings.length,
        currentRecordingProgress: 0,
      })

      // Start processing
      await processQueue()
    } catch (error) {
      console.error('Error syncing all recordings:', error)
      throw error
    }
  }, [getPendingRecordings, processQueue])

  /**
   * Sync a specific recording
   */
  const syncRecording = useCallback(
    async (id: string) => {
      if (isSyncingRef.current) {
        return // Ignore if sync already in progress
      }

      // Add to queue
      queueRef.current = [id]

      // Update progress
      setSyncProgress({
        current: 0,
        total: 1,
        currentRecordingProgress: 0,
      })

      // Start processing
      await processQueue()
    },
    [processQueue],
  )

  /**
   * Cancel all ongoing syncs
   */
  const cancelSync = useCallback(() => {
    // Abort all active uploads
    activeTasksRef.current.forEach((task) => {
      task.abortController.abort()
    })

    // Clear queue
    queueRef.current = []
    activeTasksRef.current.clear()

    // Reset state
    isSyncingRef.current = false
    setIsSyncing(false)
    setSyncProgress({
      current: 0,
      total: 0,
      currentRecordingProgress: 0,
    })
  }, [])

  /**
   * Retry all failed recordings
   */
  const retryFailed = useCallback(async () => {
    if (isSyncingRef.current) {
      return
    }

    try {
      // Get all failed recordings
      const failed = await getRecordingsByStatus('failed')

      // Reset their status to pending
      await Promise.all(
        failed.map((recording) =>
          updateRecordingStatus(recording.id, 'pending_upload', {
            errorMessage: null,
          }),
        ),
      )

      // Sync all pending recordings
      await syncAll()
    } catch (error) {
      console.error('Error retrying failed recordings:', error)
      throw error
    }
  }, [getRecordingsByStatus, updateRecordingStatus, syncAll])

  // Auto-sync when coming online
  useEffect(() => {
    if (opts.autoSync && isOnline && !isSyncingRef.current) {
      // Small delay to ensure network is stable
      const timer = setTimeout(() => {
        syncAll().catch((error) => {
          console.error('Auto-sync failed:', error)
        })
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, opts.autoSync, syncAll])

  // Update counts on mount and when syncing completes
  useEffect(() => {
    updateCounts()
  }, [updateCounts, isSyncing])

  return {
    isSyncing,
    syncProgress,
    pendingCount,
    failedCount,
    syncAll,
    syncRecording,
    cancelSync,
    retryFailed,
  }
}
