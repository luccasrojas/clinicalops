import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Recording status types
 */
export type RecordingStatus = 'pending_upload' | 'uploading' | 'synced' | 'failed' | 'partial';

/**
 * Recording record stored in IndexedDB
 */
export interface RecordingRecord {
  id: string;
  doctorID: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  duration: number; // seconds
  size: number; // bytes
  status: RecordingStatus;
  syncAttempts: number;
  lastSyncAttempt: string | null;
  errorMessage: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  syncedAt: string | null; // ISO 8601
  historyID: string | null;
  metadata: {
    patientID?: string;
    sessionNotes?: string;
  };
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalRecordings: number;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  totalSize: number; // bytes
  availableSpace: number; // bytes (estimate)
}

/**
 * IndexedDB schema definition
 */
interface RecordingsDB extends DBSchema {
  recordings: {
    key: string;
    value: RecordingRecord;
    indexes: {
      'by-status': string;
      'by-doctor': string;
      'by-created': string;
      'by-synced': string;
    };
  };
}

const DB_NAME = 'clinicalops-recordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

/**
 * Service for managing recording storage in IndexedDB
 */
export class RecordingStorageService {
  private dbPromise: Promise<IDBPDatabase<RecordingsDB>> | null = null;

  /**
   * Initialize and get database connection
   */
  private async getDB(): Promise<IDBPDatabase<RecordingsDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<RecordingsDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            
            // Create indexes for efficient querying
            store.createIndex('by-status', 'status', { unique: false });
            store.createIndex('by-doctor', 'doctorID', { unique: false });
            store.createIndex('by-created', 'createdAt', { unique: false });
            store.createIndex('by-synced', 'syncedAt', { unique: false });
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a new recording to IndexedDB
   */
  async saveRecording(
    data: Omit<RecordingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const db = await this.getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    const record: RecordingRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.add(STORE_NAME, record);
    return id;
  }

  /**
   * Get a recording by ID
   */
  async getRecording(id: string): Promise<RecordingRecord | null> {
    const db = await this.getDB();
    const record = await db.get(STORE_NAME, id);
    return record || null;
  }

  /**
   * Get all recordings
   */
  async getAllRecordings(): Promise<RecordingRecord[]> {
    const db = await this.getDB();
    return db.getAll(STORE_NAME);
  }

  /**
   * Get recordings by status
   */
  async getRecordingsByStatus(status: RecordingStatus): Promise<RecordingRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex(STORE_NAME, 'by-status', status);
  }

  /**
   * Get pending recordings (pending_upload status)
   */
  async getPendingRecordings(): Promise<RecordingRecord[]> {
    return this.getRecordingsByStatus('pending_upload');
  }

  /**
   * Update recording status and optional fields
   */
  async updateRecordingStatus(
    id: string,
    status: RecordingStatus,
    updates?: Partial<RecordingRecord>
  ): Promise<void> {
    const db = await this.getDB();
    const record = await db.get(STORE_NAME, id);
    
    if (!record) {
      throw new Error(`Recording with id ${id} not found`);
    }

    const updatedRecord: RecordingRecord = {
      ...record,
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };

    await db.put(STORE_NAME, updatedRecord);
  }

  /**
   * Delete a recording by ID
   */
  async deleteRecording(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAME, id);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const db = await this.getDB();
    const allRecordings = await db.getAll(STORE_NAME);

    const stats: StorageStats = {
      totalRecordings: allRecordings.length,
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
      totalSize: 0,
      availableSpace: 0,
    };

    // Calculate counts and total size
    for (const recording of allRecordings) {
      stats.totalSize += recording.size;
      
      switch (recording.status) {
        case 'pending_upload':
          stats.pendingCount++;
          break;
        case 'synced':
          stats.syncedCount++;
          break;
        case 'failed':
          stats.failedCount++;
          break;
      }
    }

    // Estimate available space
    const quota = await this.estimateQuota();
    stats.availableSpace = quota.quota - quota.usage;

    return stats;
  }

  /**
   * Clean up synced recordings older than specified days
   */
  async cleanupSyncedRecordings(olderThanDays: number): Promise<number> {
    const db = await this.getDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    const syncedRecordings = await db.getAllFromIndex(STORE_NAME, 'by-status', 'synced');
    let deletedCount = 0;

    for (const recording of syncedRecordings) {
      // Only delete if synced date exists and is older than cutoff
      if (recording.syncedAt && recording.syncedAt < cutoffISO) {
        await db.delete(STORE_NAME, recording.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Estimate storage quota
   */
  async estimateQuota(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    
    // Fallback if Storage API not available
    return {
      usage: 0,
      quota: 0,
    };
  }

  /**
   * Check if storage is low (less than specified bytes available)
   */
  async isStorageLow(thresholdBytes: number = 100 * 1024 * 1024): Promise<boolean> {
    const quota = await this.estimateQuota();
    const available = quota.quota - quota.usage;
    return available < thresholdBytes;
  }

  /**
   * Get recordings eligible for cleanup (synced and older than specified days)
   */
  async getCleanupEligibleRecordings(olderThanDays: number): Promise<RecordingRecord[]> {
    const db = await this.getDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    const syncedRecordings = await db.getAllFromIndex(STORE_NAME, 'by-status', 'synced');
    
    return syncedRecordings.filter(
      recording => recording.syncedAt && recording.syncedAt < cutoffISO
    );
  }
}

// Export singleton instance
export const recordingStorageService = new RecordingStorageService();
