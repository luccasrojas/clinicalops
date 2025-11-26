import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMediaRecorder } from '../hooks/use-media-recorder'
import { useRecordingStorage } from '../hooks/use-recording-storage'
import { useSyncManager } from '../hooks/use-sync-manager'
import { useNetworkStatus } from '../hooks/use-network-status'
import * as generatePresignedUrlApi from '../api/generate-presigned-url'
import * as createHistoryApi from '../api/create-history-from-recording'

// Mock network status
vi.mock('../hooks/use-network-status')

// Mock APIs
vi.mock('../api/generate-presigned-url')
vi.mock('../api/create-history-from-recording')

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private chunks: Blob[] = []

  constructor(stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType || 'audio/webm;codecs=opus'
  }

  start() {
    this.state = 'recording'
    setTimeout(() => {
      if (this.ondataavailable) {
        const chunk = new Blob(['audio-chunk-1'], { type: this.mimeType })
        this.chunks.push(chunk)
        this.ondataavailable({ data: chunk })
      }
    }, 50)
  }

  pause() {
    this.state = 'paused'
  }

  resume() {
    this.state = 'recording'
    setTimeout(() => {
      if (this.ondataavailable) {
        const chunk = new Blob(['audio-chunk-2'], { type: this.mimeType })
        this.chunks.push(chunk)
        this.ondataavailable({ data: chunk })
      }
    }, 50)
  }

  stop() {
    this.state = 'inactive'
    setTimeout(() => {
      if (this.onstop) {
        this.onstop()
      }
    }, 10)
  }

  static isTypeSupported(mimeType: string): boolean {
    return mimeType.includes('audio/webm') || mimeType.includes('audio/ogg')
  }
}

class MockMediaStream {
  active = true
  id = 'mock-stream-id'

  getTracks() {
    return [{ kind: 'audio', stop: vi.fn() }]
  }

  getAudioTracks() {
    return this.getTracks()
  }
}

describe('Recording Flow Integration Tests', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>
  let mockFetch: ReturnType<typeof vi.fn>
  let originalMediaRecorder: typeof MediaRecorder | undefined

  beforeEach(() => {
    // Setup MediaRecorder
    originalMediaRecorder = (global as any).MediaRecorder
    ;(global as any).MediaRecorder = MockMediaRecorder

    // Setup getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue(new MockMediaStream())
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    })

    // Setup fetch
    mockFetch = vi.fn().mockResolvedValue({ ok: true, statusText: 'OK' })
    global.fetch = mockFetch

    // Mock network status - online by default
    ;(useNetworkStatus as any).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    // Mock APIs
    vi.spyOn(generatePresignedUrlApi, 'generatePresignedUrl').mockResolvedValue(
      {
        uploadURL: 'https://s3.amazonaws.com/bucket/key?signature=xyz',
        fileKey: 'recordings/test.webm',
        expiresIn: 3600,
        bucketName: 'test-bucket',
      },
    )

    vi.spyOn(createHistoryApi, 'createHistoryFromRecording').mockResolvedValue({
      history: {
        historyID: 'history-123',
        doctorID: 'doctor-123',
        recordingURL: 'https://s3.amazonaws.com/bucket/key',
        status: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'History created successfully',
    })

    // Mock requestAnimationFrame
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalMediaRecorder) {
      ;(global as any).MediaRecorder = originalMediaRecorder
    } else {
      delete (global as any).MediaRecorder
    }
    vi.restoreAllMocks()
  })

  it('should complete full recording flow: record → pause → resume → stop → save', async () => {
    const { result: recorderResult } = renderHook(() => useMediaRecorder())
    const { result: storageResult } = renderHook(() => useRecordingStorage())

    // Start recording
    await act(async () => {
      await recorderResult.current.startRecording()
    })
    expect(recorderResult.current.status).toBe('recording')

    // Wait for first chunk
    await waitFor(
      () => {
        expect(recorderResult.current.status).toBe('recording')
      },
      { timeout: 100 },
    )

    // Pause recording
    act(() => {
      recorderResult.current.pauseRecording()
    })
    expect(recorderResult.current.status).toBe('paused')

    // Resume recording
    act(() => {
      recorderResult.current.resumeRecording()
    })
    expect(recorderResult.current.status).toBe('recording')

    // Wait for second chunk
    await waitFor(
      () => {
        expect(recorderResult.current.status).toBe('recording')
      },
      { timeout: 100 },
    )

    // Stop recording
    let finalBlob: Blob | undefined
    await act(async () => {
      finalBlob = await recorderResult.current.stopRecording()
    })

    expect(finalBlob).toBeInstanceOf(Blob)
    expect(recorderResult.current.status).toBe('stopped')

    // Save to IndexedDB
    let recordingId: string | undefined
    await act(async () => {
      recordingId = await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: finalBlob!,
        fileName: 'test-recording.webm',
        mimeType: 'audio/webm',
        duration: recorderResult.current.duration,
        size: finalBlob!.size,
        status: 'pending_upload',
        syncAttempts: 0,
        lastSyncAttempt: null,
        errorMessage: null,
        syncedAt: null,
        historyID: null,
        metadata: {},
      })
    })

    expect(recordingId).toBeDefined()

    // Verify recording was saved
    await waitFor(() => {
      expect(storageResult.current.storageStats?.totalRecordings).toBe(1)
      expect(storageResult.current.storageStats?.pendingCount).toBe(1)
    })
  })

  it('should handle offline → online flow with auto-sync', async () => {
    // Start offline
    ;(useNetworkStatus as any).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: '4g',
    })

    const { result: recorderResult } = renderHook(() => useMediaRecorder())
    const { result: storageResult } = renderHook(() => useRecordingStorage())
    const { result: syncResult, rerender } = renderHook(() =>
      useSyncManager({ autoSync: true }),
    )

    // Record while offline
    await act(async () => {
      await recorderResult.current.startRecording()
    })

    await waitFor(
      () => {
        expect(recorderResult.current.status).toBe('recording')
      },
      { timeout: 100 },
    )

    let finalBlob: Blob | undefined
    await act(async () => {
      finalBlob = await recorderResult.current.stopRecording()
    })

    // Save recording
    let recordingId: string | undefined
    await act(async () => {
      recordingId = await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: finalBlob!,
        fileName: 'offline-recording.webm',
        mimeType: 'audio/webm',
        duration: 60,
        size: finalBlob!.size,
        status: 'pending_upload',
        syncAttempts: 0,
        lastSyncAttempt: null,
        errorMessage: null,
        syncedAt: null,
        historyID: null,
        metadata: {},
      })
    })

    expect(recordingId).toBeDefined()

    // Verify recording is pending
    await waitFor(() => {
      expect(storageResult.current.storageStats?.pendingCount).toBe(1)
    })

    // Go online
    ;(useNetworkStatus as any).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    rerender()

    // Wait for auto-sync to complete
    await waitFor(
      () => {
        expect(generatePresignedUrlApi.generatePresignedUrl).toHaveBeenCalled()
        expect(mockFetch).toHaveBeenCalled()
        expect(createHistoryApi.createHistoryFromRecording).toHaveBeenCalled()
      },
      { timeout: 3000 },
    )
  })

  it('should handle error recovery scenarios', async () => {
    const { result: recorderResult } = renderHook(() => useMediaRecorder())
    const { result: storageResult } = renderHook(() => useRecordingStorage())
    const { result: syncResult } = renderHook(() =>
      useSyncManager({ autoSync: false, retryAttempts: 3, retryDelay: 10 }),
    )

    // Record successfully
    await act(async () => {
      await recorderResult.current.startRecording()
    })

    await waitFor(
      () => {
        expect(recorderResult.current.status).toBe('recording')
      },
      { timeout: 100 },
    )

    let finalBlob: Blob | undefined
    await act(async () => {
      finalBlob = await recorderResult.current.stopRecording()
    })

    // Save recording
    let recordingId: string | undefined
    await act(async () => {
      recordingId = await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: finalBlob!,
        fileName: 'error-test.webm',
        mimeType: 'audio/webm',
        duration: 60,
        size: finalBlob!.size,
        status: 'pending_upload',
        syncAttempts: 0,
        lastSyncAttempt: null,
        errorMessage: null,
        syncedAt: null,
        historyID: null,
        metadata: {},
      })
    })

    // Simulate upload failure
    let attemptCount = 0
    mockFetch.mockImplementation(() => {
      attemptCount++
      if (attemptCount < 3) {
        return Promise.resolve({ ok: false, statusText: 'Server Error' })
      }
      return Promise.resolve({ ok: true, statusText: 'OK' })
    })

    // Try to sync - should retry and eventually succeed
    await act(async () => {
      await syncResult.current.syncRecording(recordingId!)
    })

    // Verify retries happened
    expect(mockFetch).toHaveBeenCalledTimes(3)

    // Verify recording was eventually synced
    await waitFor(async () => {
      const recording = await storageResult.current.getRecording(recordingId!)
      expect(recording?.status).toBe('synced')
    })
  })

  it('should handle cleanup functionality', async () => {
    const { result: storageResult } = renderHook(() => useRecordingStorage())

    // Create old synced recording
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)

    await act(async () => {
      await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: new Blob(['old-audio'], { type: 'audio/webm' }),
        fileName: 'old-recording.webm',
        mimeType: 'audio/webm',
        duration: 60,
        size: 1024,
        status: 'synced',
        syncAttempts: 1,
        lastSyncAttempt: oldDate.toISOString(),
        errorMessage: null,
        syncedAt: oldDate.toISOString(),
        historyID: 'history-old',
        metadata: {},
      })
    })

    // Create recent synced recording
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3)

    await act(async () => {
      await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: new Blob(['recent-audio'], { type: 'audio/webm' }),
        fileName: 'recent-recording.webm',
        mimeType: 'audio/webm',
        duration: 60,
        size: 1024,
        status: 'synced',
        syncAttempts: 1,
        lastSyncAttempt: recentDate.toISOString(),
        errorMessage: null,
        syncedAt: recentDate.toISOString(),
        historyID: 'history-recent',
        metadata: {},
      })
    })

    // Create pending recording
    await act(async () => {
      await storageResult.current.saveRecording({
        doctorID: 'doctor-123',
        blob: new Blob(['pending-audio'], { type: 'audio/webm' }),
        fileName: 'pending-recording.webm',
        mimeType: 'audio/webm',
        duration: 60,
        size: 1024,
        status: 'pending_upload',
        syncAttempts: 0,
        lastSyncAttempt: null,
        errorMessage: null,
        syncedAt: null,
        historyID: null,
        metadata: {},
      })
    })

    // Verify initial state
    await waitFor(() => {
      expect(storageResult.current.storageStats?.totalRecordings).toBe(3)
      expect(storageResult.current.storageStats?.syncedCount).toBe(2)
      expect(storageResult.current.storageStats?.pendingCount).toBe(1)
    })

    // Cleanup recordings older than 7 days
    let deletedCount: number = 0
    await act(async () => {
      deletedCount = await storageResult.current.cleanupSyncedRecordings(7)
    })

    expect(deletedCount).toBe(1)

    // Verify only old synced recording was deleted
    await waitFor(() => {
      expect(storageResult.current.storageStats?.totalRecordings).toBe(2)
      expect(storageResult.current.storageStats?.syncedCount).toBe(1)
      expect(storageResult.current.storageStats?.pendingCount).toBe(1)
    })
  })
})
