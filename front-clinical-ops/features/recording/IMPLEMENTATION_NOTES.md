# Task 5.2 Implementation: Automatic Sync on Network Reconnection

## Overview

Task 5.2 has been successfully implemented, adding automatic synchronization of recordings when network connection is restored. This implementation includes the prerequisite hooks from tasks 3.1 and 5.1.

## Files Created

### 1. `hooks/use-network-status.ts`
Network monitoring hook that:
- Listens to browser online/offline events
- Uses Network Information API when available
- Performs periodic health checks (every 30 seconds)
- Debounces status changes to avoid flapping
- Persists last known status in localStorage
- Provides connection type and speed information

### 2. `hooks/use-sync-manager.ts`
Synchronization manager hook that:
- Automatically syncs recordings when network reconnects
- Processes recordings in chronological order (oldest first)
- Supports concurrent uploads (max 2 simultaneous)
- Implements exponential backoff retry logic (1s, 2s, 4s)
- Updates recording status in IndexedDB after each upload
- Cancels ongoing uploads when network is lost
- Provides progress tracking and statistics

### 3. `app/api/health/route.ts`
Simple health check endpoint for network status verification

### 4. `hooks/README.md`
Documentation for all recording hooks with usage examples

### 5. `hooks/index.ts` (updated)
Exports for new hooks and types

## Requirements Coverage

All acceptance criteria from Requirement 4 are fully implemented:

### 4.1 - Automatic Sync on Reconnection ✅
```typescript
// In useSyncManager hook
useEffect(() => {
  if (!opts.autoSync) return;
  
  // Detect transition from offline to online
  if (wasOfflineRef.current && isOnline) {
    console.log('Network reconnected - triggering automatic sync');
    syncAll().catch(error => {
      console.error('Auto-sync failed:', error);
    });
  }
  
  wasOfflineRef.current = !isOnline;
}, [isOnline, opts.autoSync, syncAll]);
```

### 4.2 - Chronological Upload Order ✅
```typescript
// In syncAll function
const pendingRecordings = await recordingStorageService.getPendingRecordings();

// Sort by createdAt (oldest first)
pendingRecordings.sort((a, b) => 
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);
```

### 4.3 - Status Updates in IndexedDB ✅
```typescript
// After successful upload
await recordingStorageService.updateRecordingStatus(
  recording.id,
  'synced',
  {
    syncedAt: new Date().toISOString(),
    historyID: historyResponse.history.historyID,
    errorMessage: null,
  }
);
```

### 4.4 - Retry with Exponential Backoff ✅
```typescript
// In uploadRecording function
const maxAttempts = opts.retryAttempts; // Default: 3

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    // Upload logic...
    return; // Success
  } catch (error) {
    if (attempt === maxAttempts - 1) break;
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = opts.retryDelay * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Mark as failed after all attempts
await recordingStorageService.updateRecordingStatus(
  recording.id,
  'failed',
  { errorMessage: lastError?.message }
);
```

## Upload Flow

1. **Network Detection**: `useNetworkStatus` monitors connection status
2. **Reconnection Trigger**: When offline → online transition detected, `syncAll()` is called
3. **Queue Building**: Pending recordings fetched and sorted by creation date
4. **Batch Processing**: Recordings uploaded in batches (max 2 concurrent)
5. **Upload Steps** (per recording):
   - Update status to 'uploading'
   - Generate presigned S3 URL
   - Upload blob to S3
   - Create medical history from recording
   - Update status to 'synced' with historyID
6. **Error Handling**: Failed uploads retry with exponential backoff
7. **Cancellation**: If network lost during sync, all uploads are cancelled

## Configuration Options

```typescript
const syncManager = useSyncManager({
  autoSync: true,        // Enable automatic sync on reconnection
  maxConcurrent: 2,      // Max simultaneous uploads
  retryAttempts: 3,      // Number of retry attempts per recording
  retryDelay: 1000,      // Initial retry delay in milliseconds
});
```

## Testing Recommendations

To test the implementation:

1. **Network Reconnection**:
   - Start recording while online
   - Turn off network (airplane mode or dev tools)
   - Complete recording (saves to IndexedDB)
   - Turn network back on
   - Verify automatic sync starts

2. **Retry Logic**:
   - Mock Lambda API to fail first 2 attempts
   - Verify exponential backoff delays (1s, 2s)
   - Verify success on 3rd attempt

3. **Cancellation**:
   - Start sync with multiple recordings
   - Turn off network mid-sync
   - Verify uploads are cancelled
   - Verify recordings remain in pending state

4. **Status Updates**:
   - Check IndexedDB after each upload
   - Verify status transitions: pending_upload → uploading → synced
   - Verify metadata updates (syncAttempts, syncedAt, historyID)

## Next Steps

The following related tasks can now be implemented:

- **Task 5.3**: Implement progress tracking for uploads (UI components)
- **Task 5.4**: Write unit tests for useSyncManager
- **Task 7.2**: Add sync status notifications (toasts)
- **Task 7.3**: Add pending recordings counter badge

## Notes

- The implementation assumes the Lambda API endpoints (`generate_presigned_url` and `create_medical_history_from_recording`) are already deployed and functional
- Network health checks ping `/api/health` endpoint every 30 seconds
- The hook automatically cancels uploads when network is lost to avoid hanging requests
- All sync operations are logged to console for debugging
