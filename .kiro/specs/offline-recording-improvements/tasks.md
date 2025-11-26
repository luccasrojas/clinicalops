# Implementation Plan

- [x] 1. Setup infrastructure and core services

  - Create IndexedDB service with schema for recording storage
  - Implement CRUD operations for recordings (save, get, update, delete)
  - Add indexes for efficient querying by status, doctorID, and createdAt
  - Implement storage quota estimation and cleanup utilities
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2, 8.3_

- [x] 1.1 Write unit tests for RecordingStorageService

  - Test all CRUD operations with mock IndexedDB
  - Test quota exceeded handling
  - Test cleanup of old recordings
  - _Requirements: 2.1, 2.2, 8.1, 8.2_

- [x] 2. Implement custom MediaRecorder hook

  - [x] 2.1 Create useMediaRecorder hook with MediaRecorder API

    - Implement startRecording, pauseRecording, resumeRecording, stopRecording methods
    - Handle audio stream acquisition and permission requests
    - Accumulate audio chunks during pauses to create single continuous blob
    - Implement duration timer using requestAnimationFrame
    - Add cleanup logic for streams and object URLs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Add error handling for microphone permissions

    - Detect permission denied errors
    - Provide clear Spanish error messages with browser-specific instructions
    - Handle cases where MediaRecorder is not supported
    - _Requirements: 6.1, 6.4_

  - [x] 2.3 Write unit tests for useMediaRecorder
    - Mock MediaRecorder API
    - Test pause/resume creates continuous blob
    - Test permission error handling
    - Test cleanup on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement network status monitoring

  - [x] 3.1 Create useNetworkStatus hook

    - Listen to online/offline events
    - Use Network Information API when available
    - Implement health check ping to verify real connectivity
    - Debounce status changes to avoid flapping
    - Persist last known status in localStorage
    - _Requirements: 3.1, 3.3, 4.1_

  - [x] 3.2 Add network status indicator to UI
    - Create NetworkStatusBadge component
    - Show online/offline state with appropriate colors
    - Display connection type when available
    - _Requirements: 3.3_

- [x] 4. Integrate IndexedDB storage with recording flow

  - [x] 4.1 Create useRecordingStorage hook

    - Wrap RecordingStorageService with React hooks
    - Implement saveRecording that stores blob and metadata
    - Add methods to query recordings by status
    - Provide real-time storage stats
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 4.2 Update RecordingInterface to save recordings locally

    - Save recording to IndexedDB immediately after stopRecording
    - Generate UUID for each recording
    - Store metadata (doctorID, duration, size, timestamp)
    - Set initial status as 'pending_upload'
    - _Requirements: 2.1, 2.2, 3.2_

  - [x] 4.3 Add offline detection to RecordingInterface
    - Use useNetworkStatus to detect offline state
    - Disable immediate upload button when offline
    - Show informative message about offline mode
    - Display counter of pending recordings
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 5. Implement sync manager for automatic uploads

  - [x] 5.1 Create useSyncManager hook

    - Implement queue-based upload system
    - Process recordings in chronological order (oldest first)
    - Support concurrent uploads (max 2 simultaneous)
    - Implement exponential backoff for retries (1s, 2s, 4s)
    - Use AbortController for cancellation
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.2 Add automatic sync on network reconnection

    - Listen to network status changes
    - Trigger sync automatically when connection is restored
    - Update recording status in IndexedDB after successful upload
    - Handle upload failures with retry logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.3 Implement progress tracking for uploads

    - Track upload progress for individual recordings
    - Calculate overall progress (X of Y recordings)
    - Emit events for UI updates
    - Show progress bars in RecordingInterface
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.4 Write unit tests for useSyncManager
    - Mock fetch and Lambda API
    - Test queue ordering
    - Test retry logic with backoff
    - Test cancellation on network loss
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 6. Create recording management UI

  - [x] 6.1 Create RecordingManagementPanel component

    - Build list view of all local recordings
    - Show recording metadata (date, duration, size, status)
    - Implement filters (all, pending, synced, failed)
    - Add search functionality
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Add recording actions and controls

    - Implement play audio inline with HTML5 audio player
    - Add manual upload button for pending recordings
    - Add delete button with confirmation dialog
    - Add retry button for failed recordings
    - Show error messages for failed recordings
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 6.3 Implement storage statistics display

    - Show total recordings count by status
    - Display total storage used
    - Show available space estimate
    - Add visual storage usage bar
    - _Requirements: 8.5_

  - [x] 6.4 Add cleanup functionality

    - Create CleanupDialog component
    - Show which recordings will be deleted
    - Display space that will be freed
    - Implement manual cleanup trigger
    - Add confirmation before deletion
    - _Requirements: 5.5, 8.1, 8.4_

  - [x] 6.5 Add route and navigation for management panel
    - Create route at /dashboard/grabacion/gestionar
    - Add link from RecordingInterface
    - Add link from dashboard sidebar
    - _Requirements: 5.1_

- [x] 7. Enhance RecordingInterface with offline features

  - [x] 7.1 Replace react-media-recorder with useMediaRecorder

    - Remove react-media-recorder dependency
    - Update all recording controls to use new hook
    - Ensure pause/resume functionality works correctly
    - Test that final blob is continuous after multiple pauses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Add sync status notifications

    - Show toast notification when sync starts
    - Show success notification with link to history when complete
    - Show error notification with retry option on failure
    - Display persistent sync progress indicator
    - _Requirements: 7.3, 7.4_

  - [x] 7.3 Add pending recordings counter

    - Display badge with count of pending recordings
    - Make badge clickable to open management panel
    - Update count in real-time as recordings sync
    - _Requirements: 3.5_

  - [x] 7.4 Implement beforeunload warning
    - Detect if recording is in progress
    - Show browser confirmation dialog before leaving
    - Warn about unsaved recording
    - _Requirements: 2.3_

- [x] 8. Implement automatic cleanup system

  - [x] 8.1 Create background cleanup service

    - Check storage quota periodically
    - Identify synced recordings older than 7 days
    - Delete old recordings when storage is low (<100MB)
    - Never delete unsynced recordings
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 8.2 Add cleanup scheduling
    - Run cleanup check on app startup
    - Run cleanup after successful sync
    - Run cleanup when quota warning is detected
    - Log cleanup operations for debugging
    - _Requirements: 8.1, 8.2_

- [x] 9. Error handling and user feedback

  - [x] 9.1 Implement error recovery strategies

    - Create error strategy map for different error types
    - Implement retry logic for network errors
    - Implement fallback for recording errors (save partial)
    - Show appropriate user notifications for each error type
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.2 Add Spanish error messages

    - Create error message dictionary
    - Provide actionable instructions for each error
    - Include browser-specific guidance for permissions
    - Add links to help documentation where appropriate
    - _Requirements: 6.5_

  - [x] 9.3 Implement error logging
    - Log errors to console with context
    - Store error details in recording metadata
    - Create error log view in management panel
    - _Requirements: 6.4, 7.5_

- [x] 10. Integration testing and polish

  - [x] 10.1 Write integration tests

    - Test complete recording flow (record → pause → resume → stop → save)
    - Test offline → online flow with auto-sync
    - Test error recovery scenarios
    - Test cleanup functionality
    - _Requirements: All_

  - [x] 10.2 Cross-browser testing

    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile (iOS Safari, Android Chrome)
    - Document any browser-specific issues
    - Implement polyfills or fallbacks if needed
    - _Requirements: All_

  - [x] 10.3 Performance optimization

    - Implement lazy loading for management panel
    - Add pagination for large recording lists
    - Optimize IndexedDB queries with proper indexes
    - Implement memory cleanup for audio blobs
    - _Requirements: 2.5, 8.5_

  - [x] 10.4 Add user documentation
    - Create help text for offline mode
    - Add tooltips for recording controls
    - Document storage management
    - Create FAQ for common issues
    - _Requirements: 6.5_

- [x] 11. Deployment and monitoring

  - [x] 11.1 Add feature flag

    - Create ENABLE_OFFLINE_RECORDING env variable
    - Implement feature toggle in code
    - Keep old implementation as fallback
    - _Requirements: All_

  - [x] 11.2 Add performance monitoring

    - Track recording duration metrics
    - Track upload success/failure rates
    - Track storage usage statistics
    - Monitor sync queue length
    - _Requirements: All_

  - [x] 11.3 Deploy to staging

    - Test with real users
    - Monitor error rates
    - Gather feedback
    - Fix critical issues before production
    - _Requirements: All_

  - [x] 11.4 Production deployment
    - Enable feature flag for all users
    - Monitor metrics closely
    - Be ready to rollback if needed
    - Document any issues and resolutions
    - _Requirements: All_

