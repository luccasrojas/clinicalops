import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RecordingStorageService, RecordingRecord, RecordingStatus } from './recording-storage.service';
import 'fake-indexeddb/auto';

describe('RecordingStorageService', () => {
  let service: RecordingStorageService;
  const mockDoctorID = 'doctor-123';

  // Helper to create a mock blob
  const createMockBlob = (size: number = 1024): Blob => {
    const data = new Uint8Array(size);
    return new Blob([data], { type: 'audio/webm' });
  };

  // Helper to create mock recording data
  const createMockRecordingData = (overrides?: Partial<Omit<RecordingRecord, 'id' | 'createdAt' | 'updatedAt'>>) => ({
    doctorID: mockDoctorID,
    blob: createMockBlob(),
    fileName: 'test-recording.webm',
    mimeType: 'audio/webm',
    duration: 120,
    size: 1024,
    status: 'pending_upload' as RecordingStatus,
    syncAttempts: 0,
    lastSyncAttempt: null,
    errorMessage: null,
    syncedAt: null,
    historyID: null,
    metadata: {},
    ...overrides,
  });

  beforeEach(() => {
    service = new RecordingStorageService();
  });

  afterEach(async () => {
    // Clean up all recordings after each test
    const allRecordings = await service.getAllRecordings();
    for (const recording of allRecordings) {
      await service.deleteRecording(recording.id);
    }
  });

  describe('saveRecording', () => {
    it('should save a recording and return an ID', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should save recording with all required fields', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);
      const saved = await service.getRecording(id);

      expect(saved).toBeDefined();
      expect(saved?.id).toBe(id);
      expect(saved?.doctorID).toBe(mockDoctorID);
      expect(saved?.fileName).toBe('test-recording.webm');
      expect(saved?.mimeType).toBe('audio/webm');
      expect(saved?.duration).toBe(120);
      expect(saved?.size).toBe(1024);
      expect(saved?.status).toBe('pending_upload');
      expect(saved?.createdAt).toBeDefined();
      expect(saved?.updatedAt).toBeDefined();
    });

    it('should save blob data correctly', async () => {
      const blob = createMockBlob(2048);
      const data = createMockRecordingData({ blob, size: 2048 });
      const id = await service.saveRecording(data);
      const saved = await service.getRecording(id);

      // Note: fake-indexeddb may not perfectly serialize Blobs, but we verify the data is stored
      expect(saved?.blob).toBeDefined();
      expect(saved?.size).toBe(2048);
      expect(saved?.mimeType).toBe('audio/webm');
    });
  });

  describe('getRecording', () => {
    it('should retrieve a recording by ID', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);
      const retrieved = await service.getRecording(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(id);
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await service.getRecording('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllRecordings', () => {
    it('should return empty array when no recordings exist', async () => {
      const recordings = await service.getAllRecordings();
      expect(recordings).toEqual([]);
    });

    it('should return all saved recordings', async () => {
      const data1 = createMockRecordingData({ fileName: 'recording1.webm' });
      const data2 = createMockRecordingData({ fileName: 'recording2.webm' });
      
      await service.saveRecording(data1);
      await service.saveRecording(data2);

      const recordings = await service.getAllRecordings();
      expect(recordings).toHaveLength(2);
    });
  });

  describe('getRecordingsByStatus', () => {
    it('should return recordings filtered by status', async () => {
      await service.saveRecording(createMockRecordingData({ status: 'pending_upload' }));
      await service.saveRecording(createMockRecordingData({ status: 'synced' }));
      await service.saveRecording(createMockRecordingData({ status: 'pending_upload' }));

      const pending = await service.getRecordingsByStatus('pending_upload');
      const synced = await service.getRecordingsByStatus('synced');

      expect(pending).toHaveLength(2);
      expect(synced).toHaveLength(1);
    });

    it('should return empty array when no recordings match status', async () => {
      await service.saveRecording(createMockRecordingData({ status: 'pending_upload' }));
      const failed = await service.getRecordingsByStatus('failed');
      expect(failed).toEqual([]);
    });
  });

  describe('getPendingRecordings', () => {
    it('should return only pending_upload recordings', async () => {
      await service.saveRecording(createMockRecordingData({ status: 'pending_upload' }));
      await service.saveRecording(createMockRecordingData({ status: 'synced' }));
      await service.saveRecording(createMockRecordingData({ status: 'pending_upload' }));

      const pending = await service.getPendingRecordings();
      expect(pending).toHaveLength(2);
      expect(pending.every(r => r.status === 'pending_upload')).toBe(true);
    });
  });

  describe('updateRecordingStatus', () => {
    it('should update recording status', async () => {
      const data = createMockRecordingData({ status: 'pending_upload' });
      const id = await service.saveRecording(data);

      await service.updateRecordingStatus(id, 'uploading');
      const updated = await service.getRecording(id);

      expect(updated?.status).toBe('uploading');
    });

    it('should update additional fields when provided', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);

      await service.updateRecordingStatus(id, 'synced', {
        syncedAt: new Date().toISOString(),
        historyID: 'history-123',
      });

      const updated = await service.getRecording(id);
      expect(updated?.status).toBe('synced');
      expect(updated?.syncedAt).toBeDefined();
      expect(updated?.historyID).toBe('history-123');
    });

    it('should update updatedAt timestamp', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);
      const original = await service.getRecording(id);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await service.updateRecordingStatus(id, 'uploading');
      const updated = await service.getRecording(id);

      expect(updated?.updatedAt).not.toBe(original?.updatedAt);
    });

    it('should throw error for non-existent recording', async () => {
      await expect(
        service.updateRecordingStatus('non-existent-id', 'synced')
      ).rejects.toThrow('Recording with id non-existent-id not found');
    });
  });

  describe('deleteRecording', () => {
    it('should delete a recording', async () => {
      const data = createMockRecordingData();
      const id = await service.saveRecording(data);

      await service.deleteRecording(id);
      const deleted = await service.getRecording(id);

      expect(deleted).toBeNull();
    });

    it('should not throw error when deleting non-existent recording', async () => {
      await expect(
        service.deleteRecording('non-existent-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getStorageStats', () => {
    it('should return correct statistics', async () => {
      await service.saveRecording(createMockRecordingData({ 
        status: 'pending_upload',
        size: 1000,
      }));
      await service.saveRecording(createMockRecordingData({ 
        status: 'synced',
        size: 2000,
      }));
      await service.saveRecording(createMockRecordingData({ 
        status: 'failed',
        size: 1500,
      }));

      const stats = await service.getStorageStats();

      expect(stats.totalRecordings).toBe(3);
      expect(stats.pendingCount).toBe(1);
      expect(stats.syncedCount).toBe(1);
      expect(stats.failedCount).toBe(1);
      expect(stats.totalSize).toBe(4500);
      expect(stats.availableSpace).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats for empty database', async () => {
      const stats = await service.getStorageStats();

      expect(stats.totalRecordings).toBe(0);
      expect(stats.pendingCount).toBe(0);
      expect(stats.syncedCount).toBe(0);
      expect(stats.failedCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('cleanupSyncedRecordings', () => {
    it('should delete synced recordings older than specified days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      // Old synced recording (should be deleted)
      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: oldDate.toISOString(),
      }));

      // Recent synced recording (should not be deleted)
      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: recentDate.toISOString(),
      }));

      // Pending recording (should not be deleted)
      await service.saveRecording(createMockRecordingData({
        status: 'pending_upload',
      }));

      const deletedCount = await service.cleanupSyncedRecordings(7);
      const remaining = await service.getAllRecordings();

      expect(deletedCount).toBe(1);
      expect(remaining).toHaveLength(2);
    });

    it('should not delete recordings without syncedAt date', async () => {
      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: null,
      }));

      const deletedCount = await service.cleanupSyncedRecordings(7);
      const remaining = await service.getAllRecordings();

      expect(deletedCount).toBe(0);
      expect(remaining).toHaveLength(1);
    });

    it('should return 0 when no recordings are eligible for cleanup', async () => {
      const recentDate = new Date();
      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: recentDate.toISOString(),
      }));

      const deletedCount = await service.cleanupSyncedRecordings(7);
      expect(deletedCount).toBe(0);
    });
  });

  describe('estimateQuota', () => {
    it('should return quota estimation', async () => {
      const quota = await service.estimateQuota();

      expect(quota).toHaveProperty('usage');
      expect(quota).toHaveProperty('quota');
      expect(typeof quota.usage).toBe('number');
      expect(typeof quota.quota).toBe('number');
    });
  });

  describe('isStorageLow', () => {
    it('should check if storage is below threshold', async () => {
      const isLow = await service.isStorageLow(100 * 1024 * 1024);
      expect(typeof isLow).toBe('boolean');
    });
  });

  describe('getCleanupEligibleRecordings', () => {
    it('should return synced recordings older than specified days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: oldDate.toISOString(),
        fileName: 'old-recording.webm',
      }));

      await service.saveRecording(createMockRecordingData({
        status: 'synced',
        syncedAt: recentDate.toISOString(),
        fileName: 'recent-recording.webm',
      }));

      const eligible = await service.getCleanupEligibleRecordings(7);

      expect(eligible).toHaveLength(1);
      expect(eligible[0].fileName).toBe('old-recording.webm');
    });

    it('should not include pending recordings', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      await service.saveRecording(createMockRecordingData({
        status: 'pending_upload',
        syncedAt: oldDate.toISOString(),
      }));

      const eligible = await service.getCleanupEligibleRecordings(7);
      expect(eligible).toHaveLength(0);
    });
  });
});
