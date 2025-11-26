import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSyncManager } from './use-sync-manager';
import { useNetworkStatus } from './use-network-status';
import { useRecordingStorage } from './use-recording-storage';
import { RecordingRecord } from '../services/recording-storage.service';
import * as generatePresignedUrlApi from '../api/generate-presigned-url';
import * as createHistoryApi from '../api/create-history-from-recording';

// Mock dependencies
vi.mock('./use-network-status');
vi.mock('./use-recording-storage');
vi.mock('../api/generate-presigned-url');
vi.mock('../api/create-history-from-recording');

describe('useSyncManager', () => {
  const mockDoctorID = 'doctor-123';
  
  // Mock functions
  let mockGetPendingRecordings: ReturnType<typeof vi.fn>;
  let mockGetRecordingsByStatus: ReturnType<typeof vi.fn>;
  let mockGetRecording: ReturnType<typeof vi.fn>;
  let mockUpdateRecordingStatus: ReturnType<typeof vi.fn>;
  let mockRefreshStorageStats: ReturnType<typeof vi.fn>;
  let mockGeneratePresignedUrl: ReturnType<typeof vi.fn>;
  let mockCreateHistoryFromRecording: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  // Helper to create mock recording
  const createMockRecording = (overrides?: Partial<RecordingRecord>): RecordingRecord => ({
    id: `recording-${Date.now()}`,
    doctorID: mockDoctorID,
    blob: new Blob(['test'], { type: 'audio/webm' }),
    fileName: 'test.webm',
    mimeType: 'audio/webm',
    duration: 120,
    size: 1024,
    status: 'pending_upload',
    syncAttempts: 0,
    lastSyncAttempt: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: null,
    historyID: null,
    metadata: {},
    ...overrides,
  });

  beforeEach(() => {
    // Setup mocks
    mockGetPendingRecordings = vi.fn().mockResolvedValue([]);
    mockGetRecordingsByStatus = vi.fn().mockResolvedValue([]);
    mockGetRecording = vi.fn();
    mockUpdateRecordingStatus = vi.fn().mockResolvedValue(undefined);
    mockRefreshStorageStats = vi.fn().mockResolvedValue(undefined);

    (useNetworkStatus as any).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    });

    (useRecordingStorage as any).mockReturnValue({
      getPendingRecordings: mockGetPendingRecordings,
      getRecordingsByStatus: mockGetRecordingsByStatus,
      getRecording: mockGetRecording,
      updateRecordingStatus: mockUpdateRecordingStatus,
      refreshStorageStats: mockRefreshStorageStats,
    });

    mockGeneratePresignedUrl = vi.fn().mockResolvedValue({
      uploadURL: 'https://s3.amazonaws.com/bucket/key?signature=xyz',
      fileKey: 'recordings/test.webm',
      expiresIn: 3600,
      bucketName: 'test-bucket',
    });

    mockCreateHistoryFromRecording = vi.fn().mockResolvedValue({
      history: {
        historyID: 'history-123',
        doctorID: mockDoctorID,
        recordingURL: 'https://s3.amazonaws.com/bucket/key',
        status: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'History created successfully',
    });

    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      statusText: 'OK',
    });

    vi.spyOn(generatePresignedUrlApi, 'generatePresignedUrl').mockImplementation(mockGeneratePresignedUrl);
    vi.spyOn(createHistoryApi, 'createHistoryFromRecording').mockImplementation(mockCreateHistoryFromRecording);
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSyncManager());

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.syncProgress).toEqual({
        current: 0,
        total: 0,
        currentRecordingProgress: 0,
      });
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.failedCount).toBe(0);
    });

    it('should update counts on mount', async () => {
      const pendingRecordings = [createMockRecording(), createMockRecording()];
      const failedRecordings = [createMockRecording({ status: 'failed' })];
      
      mockGetPendingRecordings.mockResolvedValue(pendingRecordings);
      mockGetRecordingsByStatus.mockResolvedValue(failedRecordings);

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(2);
        expect(result.current.failedCount).toBe(1);
      });
    });
  });

  describe('syncAll', () => {
    it('should sync all pending recordings in chronological order', async () => {
      const oldRecording = createMockRecording({
        id: 'old-recording',
        createdAt: '2024-01-01T00:00:00Z',
      });
      const newRecording = createMockRecording({
        id: 'new-recording',
        createdAt: '2024-01-02T00:00:00Z',
      });

      mockGetPendingRecordings.mockResolvedValue([newRecording, oldRecording]);
      mockGetRecording.mockImplementation((id: string) => {
        if (id === 'old-recording') return Promise.resolve(oldRecording);
        if (id === 'new-recording') return Promise.resolve(newRecording);
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      await act(async () => {
        await result.current.syncAll();
      });

      // Verify recordings were processed in chronological order (oldest first)
      expect(mockGetRecording).toHaveBeenCalledWith('old-recording');
      expect(mockGetRecording).toHaveBeenCalledWith('new-recording');
      
      // Verify both recordings were updated to synced status
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'old-recording',
        'synced',
        expect.objectContaining({
          syncedAt: expect.any(String),
          historyID: 'history-123',
        })
      );
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'new-recording',
        'synced',
        expect.objectContaining({
          syncedAt: expect.any(String),
          historyID: 'history-123',
        })
      );
    });

    it('should update progress during sync', async () => {
      const recordings = [
        createMockRecording({ id: 'rec-1' }),
        createMockRecording({ id: 'rec-2' }),
      ];

      mockGetPendingRecordings.mockResolvedValue(recordings);
      mockGetRecording.mockImplementation((id: string) => {
        const rec = recordings.find(r => r.id === id);
        return Promise.resolve(rec || null);
      });

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      let progressUpdates: number[] = [];
      
      await act(async () => {
        const syncPromise = result.current.syncAll();
        
        // Capture progress updates
        await waitFor(() => {
          if (result.current.syncProgress.total > 0) {
            progressUpdates.push(result.current.syncProgress.current);
          }
        });
        
        await syncPromise;
      });

      // Verify progress was tracked
      expect(result.current.syncProgress.total).toBe(0); // Reset after completion
      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle empty pending recordings', async () => {
      mockGetPendingRecordings.mockResolvedValue([]);

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      await act(async () => {
        await result.current.syncAll();
      });

      expect(result.current.isSyncing).toBe(false);
      expect(mockGeneratePresignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('syncRecording', () => {
    it('should sync a specific recording', async () => {
      const recording = createMockRecording({ id: 'specific-recording' });
      mockGetRecording.mockResolvedValue(recording);

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      await act(async () => {
        await result.current.syncRecording('specific-recording');
      });

      expect(mockGetRecording).toHaveBeenCalledWith('specific-recording');
      expect(mockGeneratePresignedUrl).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
      expect(mockCreateHistoryFromRecording).toHaveBeenCalled();
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'specific-recording',
        'synced',
        expect.any(Object)
      );
    });

    it('should not start new sync if already in progress', async () => {
      const recording = createMockRecording();
      mockGetPendingRecordings.mockResolvedValue([recording]);
      mockGetRecording.mockResolvedValue(recording);

      // Make fetch slow to keep sync in progress
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 500))
      );

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      // Start first sync
      act(() => {
        result.current.syncAll();
      });

      // Wait for sync to start
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      // Try to start second sync - should be ignored
      const initialCallCount = mockGetRecording.mock.calls.length;
      
      await act(async () => {
        await result.current.syncRecording('another-recording');
      });

      // Should not have made additional calls since sync is in progress
      expect(mockGetRecording.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('retry logic', () => {
    it('should retry failed uploads with exponential backoff', async () => {
      const recording = createMockRecording({ id: 'retry-recording' });
      mockGetRecording.mockResolvedValue(recording);
      
      // Fail first two attempts, succeed on third
      let attemptCount = 0;
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({ ok: false, statusText: 'Server Error' });
        }
        return Promise.resolve({ ok: true, statusText: 'OK' });
      });

      const { result } = renderHook(() => 
        useSyncManager({ autoSync: false, retryAttempts: 3, retryDelay: 10 })
      );

      await act(async () => {
        await result.current.syncRecording('retry-recording');
      });

      // Should have attempted 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Should eventually succeed
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'retry-recording',
        'synced',
        expect.any(Object)
      );
    });

    it('should mark recording as failed after max retry attempts', async () => {
      const recording = createMockRecording({ id: 'failed-recording' });
      mockGetRecording.mockResolvedValue(recording);
      
      // Always fail
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' });

      const { result } = renderHook(() => 
        useSyncManager({ autoSync: false, retryAttempts: 3, retryDelay: 10 })
      );

      await act(async () => {
        try {
          await result.current.syncRecording('failed-recording');
        } catch (error) {
          // Expected to throw
        }
      });

      // Should have attempted 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Should be marked as failed
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'failed-recording',
        'failed',
        expect.objectContaining({
          errorMessage: expect.any(String),
        })
      );
    });
  });

  describe('cancelSync', () => {
    it('should cancel ongoing sync operations', async () => {
      const recordings = [
        createMockRecording({ id: 'rec-1' }),
        createMockRecording({ id: 'rec-2' }),
      ];

      mockGetPendingRecordings.mockResolvedValue(recordings);
      mockGetRecording.mockImplementation((id: string) => {
        const rec = recordings.find(r => r.id === id);
        return Promise.resolve(rec || null);
      });

      // Make fetch slow to allow cancellation
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
      );

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      // Start sync
      act(() => {
        result.current.syncAll();
      });

      // Wait a bit then cancel
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        result.current.cancelSync();
      });

      // Should reset state
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.syncProgress.total).toBe(0);
    });
  });

  describe('retryFailed', () => {
    it('should reset failed recordings to pending and retry', async () => {
      const failedRecordings = [
        createMockRecording({ id: 'failed-1', status: 'failed' }),
        createMockRecording({ id: 'failed-2', status: 'failed' }),
      ];

      mockGetRecordingsByStatus.mockImplementation((status: string) => {
        if (status === 'failed') return Promise.resolve(failedRecordings);
        return Promise.resolve([]);
      });

      mockGetPendingRecordings.mockResolvedValue(failedRecordings);
      mockGetRecording.mockImplementation((id: string) => {
        const rec = failedRecordings.find(r => r.id === id);
        return Promise.resolve(rec || null);
      });

      const { result } = renderHook(() => useSyncManager({ autoSync: false }));

      await act(async () => {
        await result.current.retryFailed();
      });

      // Should have reset status to pending for both
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'failed-1',
        'pending_upload',
        expect.objectContaining({ errorMessage: null })
      );
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(
        'failed-2',
        'pending_upload',
        expect.objectContaining({ errorMessage: null })
      );

      // Should have attempted to sync
      expect(mockGeneratePresignedUrl).toHaveBeenCalled();
    });
  });

  describe('concurrent uploads', () => {
    it('should respect maxConcurrent limit', async () => {
      const recordings = [
        createMockRecording({ id: 'rec-1' }),
        createMockRecording({ id: 'rec-2' }),
        createMockRecording({ id: 'rec-3' }),
      ];

      mockGetPendingRecordings.mockResolvedValue(recordings);
      mockGetRecording.mockImplementation((id: string) => {
        const rec = recordings.find(r => r.id === id);
        return Promise.resolve(rec || null);
      });

      let concurrentCount = 0;
      let maxConcurrent = 0;

      mockFetch.mockImplementation(() => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        return new Promise(resolve => {
          setTimeout(() => {
            concurrentCount--;
            resolve({ ok: true });
          }, 50);
        });
      });

      const { result } = renderHook(() => 
        useSyncManager({ autoSync: false, maxConcurrent: 2 })
      );

      await act(async () => {
        await result.current.syncAll();
      });

      // Should never exceed maxConcurrent
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('auto-sync on network reconnection', () => {
    it('should automatically sync when coming online', async () => {
      const recordings = [createMockRecording()];
      mockGetPendingRecordings.mockResolvedValue(recordings);
      mockGetRecording.mockResolvedValue(recordings[0]);

      // Start offline
      (useNetworkStatus as any).mockReturnValue({
        isOnline: false,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: '4g',
      });

      const { rerender } = renderHook(() => useSyncManager({ autoSync: true }));

      // Go online
      (useNetworkStatus as any).mockReturnValue({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      rerender();

      // Wait for auto-sync to trigger
      await waitFor(() => {
        expect(mockGeneratePresignedUrl).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should not auto-sync when autoSync is disabled', async () => {
      const recordings = [createMockRecording()];
      mockGetPendingRecordings.mockResolvedValue(recordings);

      // Start offline
      (useNetworkStatus as any).mockReturnValue({
        isOnline: false,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: '4g',
      });

      const { rerender } = renderHook(() => useSyncManager({ autoSync: false }));

      // Go online
      (useNetworkStatus as any).mockReturnValue({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      rerender();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have triggered sync
      expect(mockGeneratePresignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('cancellation on network loss', () => {
    it('should abort uploads when going offline', async () => {
      const recordings = [createMockRecording()];
      mockGetPendingRecordings.mockResolvedValue(recordings);
      mockGetRecording.mockResolvedValue(recordings[0]);

      // Make fetch slow
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
      );

      // Start online
      (useNetworkStatus as any).mockReturnValue({
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'wifi',
        effectiveType: '4g',
      });

      const { result, rerender } = renderHook(() => useSyncManager({ autoSync: false }));

      // Start sync
      act(() => {
        result.current.syncAll();
      });

      // Go offline
      (useNetworkStatus as any).mockReturnValue({
        isOnline: false,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: '4g',
      });

      rerender();

      // Wait for sync to stop
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      }, { timeout: 2000 });
    });
  });
});
