# Automatic Cleanup System Implementation

## Overview

This document describes the automatic cleanup system implemented for managing local recording storage in the ClinicalOps application.

## Components

### 1. CleanupService (`services/cleanup.service.ts`)

Core service that handles the cleanup logic:

- **Configuration**: Configurable minimum age (default 7 days) and storage threshold (default 100MB)
- **Smart Cleanup**: Only deletes synced recordings older than the configured age
- **Safety**: Never deletes unsynced recordings, regardless of storage pressure
- **Logging**: Logs all cleanup operations with details (count, space freed, reason)
- **Persistence**: Tracks last cleanup time in localStorage

**Key Methods**:
- `shouldCleanup()`: Checks if storage is below threshold
- `performCleanup(reason)`: Executes cleanup and returns results
- `checkAndCleanup(reason)`: Combines check and cleanup in one call

### 2. useCleanupScheduler Hook (`hooks/use-cleanup-scheduler.ts`)

React hook that schedules cleanup operations:

- **Startup Cleanup**: Runs 5 seconds after app loads (configurable)
- **Post-Sync Cleanup**: Triggers after successful recording sync
- **Quota Monitoring**: Can check storage quota on demand
- **Manual Trigger**: Provides method for user-initiated cleanup

**Scheduling Points**:
1. App startup (delayed 5s to not block initial render)
2. After successful sync operations
3. When quota warnings are detected
4. Manual user action

### 3. CleanupSchedulerProvider (`components/cleanup-scheduler-provider.tsx`)

Provider component that initializes the cleanup scheduler at app level:

- Mounts at the root of the application
- Exposes cleanup trigger globally for sync manager integration
- Handles cleanup completion notifications

### 4. Integration Points

#### App Provider (`app/provider.tsx`)
- Wraps the entire app with `CleanupSchedulerProvider`
- Ensures cleanup scheduler is active throughout the app lifecycle

#### Sync Manager (`hooks/use-sync-manager.ts`)
- Added `onSyncComplete` callback option
- Triggers cleanup after successful sync operations
- Integrated in both `RecordingInterface` and `RecordingManagementPanel`

## Cleanup Flow

```
App Startup
    ↓
CleanupSchedulerProvider initializes
    ↓
After 5s delay → Check storage quota
    ↓
If storage < 100MB → Delete synced recordings > 7 days old
    ↓
Log results

Recording Sync Completes
    ↓
onSyncComplete callback triggered
    ↓
Check storage quota
    ↓
If storage < 100MB → Delete synced recordings > 7 days old
    ↓
Log results
```

## Configuration

Default configuration (can be customized):

```typescript
{
  minAgeDays: 7,                          // Minimum age for cleanup eligibility
  storageThresholdBytes: 100 * 1024 * 1024, // 100MB threshold
  enabled: true                           // Enable/disable cleanup
}
```

## Safety Guarantees

1. **Never deletes unsynced recordings**: Only recordings with status 'synced' are eligible
2. **Age requirement**: Recordings must be older than `minAgeDays` (default 7 days)
3. **Storage check**: Only runs when available space is below threshold
4. **Atomic operations**: Uses IndexedDB transactions for data integrity
5. **Error handling**: Gracefully handles errors without breaking the app

## Logging

All cleanup operations are logged with:
- Reason (manual, low_storage, scheduled, post_sync)
- Number of recordings deleted
- Space freed (in MB)
- Timestamp

Example log:
```
[CleanupService] Cleanup completed:
  Reason: post_sync
  Deleted: 3 recordings
  Space freed: 45.23 MB
  Timestamp: 2025-11-25T10:30:00.000Z
```

## Testing

To test the cleanup system:

1. **Startup cleanup**: Refresh the app and check console logs after 5 seconds
2. **Post-sync cleanup**: Complete a recording sync and observe cleanup trigger
3. **Manual cleanup**: Use the cleanup dialog in the recording management panel
4. **Storage threshold**: Fill storage to trigger automatic cleanup

## Future Enhancements

Potential improvements:
- Configurable cleanup schedule (e.g., daily at specific time)
- User preferences for cleanup policy
- Cleanup history view in UI
- Storage usage charts and trends
- Predictive cleanup based on usage patterns
