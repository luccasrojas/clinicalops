# Recording Hooks

This directory contains React hooks for managing audio recording, network status, and synchronization.

## useMediaRecorder

Custom hook for recording audio using the native MediaRecorder API. Supports pause/resume functionality and creates a single continuous audio blob.

## useNetworkStatus

Monitors network connectivity status using browser events and the Network Information API. Features:
- Listens to online/offline events
- Performs periodic health checks to verify real connectivity
- Debounces status changes to avoid flapping
- Persists last known status in localStorage
- Provides connection type information when available

## useSyncManager

Manages automatic synchronization of recordings to the server. Features:
- **Automatic sync on network reconnection**: Listens to network status changes and triggers sync when connection is restored
- Queue-based upload system with chronological ordering (oldest first)
- Concurrent uploads (max 2 simultaneous by default)
- Exponential backoff retry logic (1s, 2s, 4s)
- Cancellation support using AbortController
- Progress tracking for individual and batch uploads
- Updates recording status in IndexedDB after successful upload
- Handles upload failures with configurable retry attempts

### Usage Example

```typescript
import { useSyncManager } from '@/features/recording/hooks';

function RecordingComponent() {
  const {
    isSyncing,
    syncProgress,
    pendingCount,
    failedCount,
    syncAll,
    syncRecording,
    cancelSync,
    retryFailed,
  } = useSyncManager({
    autoSync: true,        // Enable automatic sync on reconnection
    maxConcurrent: 2,      // Max simultaneous uploads
    retryAttempts: 3,      // Number of retry attempts
    retryDelay: 1000,      // Initial retry delay in ms
  });

  // Sync happens automatically when network reconnects
  // Manual sync is also available
  const handleManualSync = () => {
    syncAll();
  };

  return (
    <div>
      {isSyncing && (
        <div>
          Syncing {syncProgress.current} of {syncProgress.total}
        </div>
      )}
      <div>Pending: {pendingCount}</div>
      <div>Failed: {failedCount}</div>
      <button onClick={handleManualSync}>Sync Now</button>
      <button onClick={retryFailed}>Retry Failed</button>
    </div>
  );
}
```

## Implementation Details

### Network Reconnection Flow

1. `useNetworkStatus` detects when the browser goes from offline to online
2. `useSyncManager` listens to the `isOnline` state change
3. When transition from offline → online is detected, `syncAll()` is automatically triggered
4. Pending recordings are fetched from IndexedDB and sorted by creation date
5. Recordings are uploaded in batches with retry logic
6. Recording status is updated in IndexedDB after each successful upload
7. If upload fails, exponential backoff retry is applied
8. After max retry attempts, recording is marked as 'failed'

### Error Handling

- Network errors during upload trigger automatic retry with exponential backoff
- If network is lost during sync, all active uploads are cancelled
- Failed recordings can be retried manually using `retryFailed()`
- Error messages are stored in IndexedDB for debugging

### Storage Updates

After each upload attempt, the recording status in IndexedDB is updated:
- `uploading`: Upload in progress
- `synced`: Successfully uploaded and medical history created
- `failed`: Upload failed after all retry attempts
- Additional metadata: `syncAttempts`, `lastSyncAttempt`, `syncedAt`, `historyID`, `errorMessage`
