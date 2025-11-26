# Cross-Browser Testing Guide - Offline Recording System

## Overview

This document provides a comprehensive testing checklist for validating the offline recording system across different browsers and platforms. All tests should be performed to ensure consistent functionality.

## Browser Support Matrix

| Browser | Desktop | Mobile | Min Version | Status          |
| ------- | ------- | ------ | ----------- | --------------- |
| Chrome  | ✅      | ✅     | 47+         | Fully Supported |
| Firefox | ✅      | ✅     | 25+         | Fully Supported |
| Safari  | ✅      | ✅     | 14.1+       | Fully Supported |
| Edge    | ✅      | ✅     | 79+         | Fully Supported |
| Opera   | ✅      | ❌     | 36+         | Desktop Only    |

## Testing Environments

### Desktop Browsers

Test on the following desktop configurations:

1. **Chrome (Latest)**
   - Windows 10/11
   - macOS 12+
   - Linux (Ubuntu 20.04+)

2. **Firefox (Latest)**
   - Windows 10/11
   - macOS 12+
   - Linux (Ubuntu 20.04+)

3. **Safari (Latest)**
   - macOS 12+

4. **Edge (Latest)**
   - Windows 10/11
   - macOS 12+

### Mobile Browsers

Test on the following mobile configurations:

1. **iOS Safari**
   - iOS 14.1+
   - iPhone 12 or newer
   - iPad (8th gen or newer)

2. **Android Chrome**
   - Android 8.0+
   - Various device manufacturers (Samsung, Google Pixel, etc.)

## Core Functionality Tests

### 1. Recording Controls

#### Test: Start Recording

**Steps**:

1. Navigate to recording interface
2. Click "Iniciar Grabación"
3. Grant microphone permissions when prompted

**Expected Results**:

- ✅ Permission dialog appears
- ✅ Recording starts after permission granted
- ✅ Timer begins counting
- ✅ Recording indicator shows active state
- ✅ Pause button becomes available

**Browser-Specific Notes**:

- **Safari**: May require user gesture to start recording
- **Firefox**: Permission dialog looks different but functions the same
- **Mobile**: Ensure touch targets are large enough

#### Test: Pause/Resume Recording

**Steps**:

1. Start a recording
2. Wait 5 seconds
3. Click "Pausar"
4. Wait 3 seconds
5. Click "Reanudar"
6. Wait 5 seconds
7. Click "Detener"

**Expected Results**:

- ✅ Recording pauses immediately
- ✅ Timer stops during pause
- ✅ Resume button appears
- ✅ Recording resumes smoothly
- ✅ Timer continues from paused time
- ✅ Final audio is continuous (no gaps)

**Browser-Specific Notes**:

- **Safari**: Test multiple pause/resume cycles
- **Firefox**: Verify audio continuity
- **Mobile**: Test with screen lock/unlock

#### Test: Stop Recording

**Steps**:

1. Start a recording
2. Record for 10 seconds
3. Click "Detener"

**Expected Results**:

- ✅ Recording stops immediately
- ✅ Final duration is accurate
- ✅ Blob is created successfully
- ✅ Recording is saved to IndexedDB
- ✅ UI returns to initial state

### 2. Offline Functionality

#### Test: Record While Offline

**Steps**:

1. Disconnect from internet (airplane mode or disable network)
2. Verify offline indicator shows
3. Start a recording
4. Record for 30 seconds
5. Stop recording

**Expected Results**:

- ✅ Offline badge displays correctly
- ✅ Recording works normally
- ✅ Recording saves to IndexedDB
- ✅ Status shows "pending_upload"
- ✅ Pending counter increments

**Browser-Specific Notes**:

- **Safari**: Test with WiFi off vs airplane mode
- **Mobile**: Test with cellular data off
- **Firefox**: Verify offline detection is accurate

#### Test: Auto-Sync on Reconnection

**Steps**:

1. Record 2-3 recordings while offline
2. Reconnect to internet
3. Wait for auto-sync to trigger

**Expected Results**:

- ✅ Online indicator appears
- ✅ Sync starts automatically within 5 seconds
- ✅ Progress indicator shows
- ✅ Recordings upload in chronological order
- ✅ Status updates to "synced"
- ✅ Success notification appears

**Browser-Specific Notes**:

- **All browsers**: Test with slow connection (throttle to 3G)
- **Mobile**: Test with WiFi reconnection
- **Safari**: Verify background sync works

### 3. Storage Management

#### Test: IndexedDB Persistence

**Steps**:

1. Record and save 3 recordings
2. Close browser completely
3. Reopen browser
4. Navigate to recording management

**Expected Results**:

- ✅ All recordings are still present
- ✅ Metadata is intact
- ✅ Audio blobs are playable
- ✅ Statistics are accurate

**Browser-Specific Notes**:

- **Safari**: Test with "Prevent Cross-Site Tracking" enabled
- **Firefox**: Test with "Delete cookies and site data when Firefox is closed" disabled
- **Mobile**: Test after device restart

#### Test: Storage Quota

**Steps**:

1. Check available storage
2. Record multiple large recordings (>100MB total)
3. Monitor storage statistics

**Expected Results**:

- ✅ Storage stats update correctly
- ✅ Warning appears when space is low
- ✅ Cleanup suggestions appear
- ✅ No crashes or data loss

**Browser-Specific Notes**:

- **Safari**: Has stricter limits (~1GB)
- **Chrome/Edge**: More generous limits
- **Mobile**: Test with low device storage

#### Test: Cleanup Functionality

**Steps**:

1. Create several synced recordings >7 days old (modify createdAt in IndexedDB for testing)
2. Trigger manual cleanup
3. Verify cleanup dialog
4. Confirm cleanup

**Expected Results**:

- ✅ Only eligible recordings shown
- ✅ Space to be freed is accurate
- ✅ Cleanup executes successfully
- ✅ Statistics update correctly
- ✅ Unsynced recordings are preserved

### 4. Audio Quality

#### Test: Audio Playback

**Steps**:

1. Record a 30-second test with speech
2. Play back the recording
3. Listen for quality issues

**Expected Results**:

- ✅ Audio is clear and understandable
- ✅ No distortion or clipping
- ✅ Volume level is appropriate
- ✅ No unexpected noise

**Browser-Specific Notes**:

- **Safari**: Test with different audio codecs
- **Firefox**: Verify Opus codec support
- **Mobile**: Test with device speaker and headphones

#### Test: Multiple Pause/Resume Audio Quality

**Steps**:

1. Record with 5 pause/resume cycles
2. Play back the recording
3. Listen at pause points

**Expected Results**:

- ✅ No audible gaps at pause points
- ✅ Audio is continuous
- ✅ No clicks or pops
- ✅ Consistent volume throughout

### 5. Error Handling

#### Test: Microphone Permission Denied

**Steps**:

1. Deny microphone permission
2. Attempt to start recording

**Expected Results**:

- ✅ Clear error message in Spanish
- ✅ Instructions for granting permission
- ✅ Browser-specific guidance
- ✅ No crash or freeze

**Browser-Specific Notes**:

- **Chrome**: Test with "Block" and "Ask"
- **Safari**: Test with system-level permissions
- **Mobile**: Test with app-level permissions

#### Test: Network Failure During Upload

**Steps**:

1. Start recording
2. Stop and save
3. Disconnect network during upload
4. Observe behavior

**Expected Results**:

- ✅ Upload fails gracefully
- ✅ Recording marked as pending
- ✅ Retry logic activates
- ✅ No data loss

#### Test: Storage Quota Exceeded

**Steps**:

1. Fill storage to near capacity
2. Attempt to record

**Expected Results**:

- ✅ Warning before recording starts
- ✅ Clear error message if quota exceeded
- ✅ Cleanup suggestions provided
- ✅ Partial recording saved if possible

### 6. UI/UX Tests

#### Test: Responsive Design

**Steps**:

1. Test on various screen sizes:
   - Desktop: 1920x1080, 1366x768
   - Tablet: 768x1024
   - Mobile: 375x667, 414x896

**Expected Results**:

- ✅ All controls are accessible
- ✅ Text is readable
- ✅ Touch targets are adequate (44x44px minimum)
- ✅ No horizontal scrolling
- ✅ Proper layout on all sizes

#### Test: Accessibility

**Steps**:

1. Navigate using keyboard only
2. Test with screen reader
3. Check color contrast

**Expected Results**:

- ✅ All controls are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Screen reader announces states correctly
- ✅ ARIA labels are present
- ✅ Color contrast meets WCAG AA

### 7. Performance Tests

#### Test: Large Recording Handling

**Steps**:

1. Record for 60+ minutes
2. Stop and save
3. Monitor memory usage

**Expected Results**:

- ✅ No memory leaks
- ✅ Recording saves successfully
- ✅ UI remains responsive
- ✅ No browser crashes

#### Test: Multiple Recordings

**Steps**:

1. Create 50+ recordings
2. Navigate to management panel
3. Test filtering and search

**Expected Results**:

- ✅ List loads quickly (<2 seconds)
- ✅ Pagination works correctly
- ✅ Filtering is responsive
- ✅ Search is fast
- ✅ No lag when scrolling

## Browser-Specific Issues and Workarounds

### Chrome/Edge

**Known Issues**:

- None currently identified

**Workarounds**:

- N/A

### Firefox

**Known Issues**:

- Slightly different audio codec preferences

**Workarounds**:

- System automatically selects best available codec
- No user action required

### Safari

**Known Issues**:

- Stricter storage limits (~1GB)
- Requires user gesture for some media operations

**Workarounds**:

- More frequent cleanup recommended
- All recording controls require user interaction (already implemented)

### iOS Safari

**Known Issues**:

- Background tab may pause recording
- Storage cleared more aggressively

**Workarounds**:

- Warn users to keep tab active during recording
- Sync more frequently on mobile

### Android Chrome

**Known Issues**:

- Battery optimization may affect background operations

**Workarounds**:

- Recommend disabling battery optimization for browser
- Keep screen on during long recordings

## Testing Checklist

Use this checklist to track testing progress:

### Desktop - Chrome

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

### Desktop - Firefox

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

### Desktop - Safari

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

### Desktop - Edge

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

### Mobile - iOS Safari

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

### Mobile - Android Chrome

- [ ] Recording controls
- [ ] Offline functionality
- [ ] Storage management
- [ ] Audio quality
- [ ] Error handling
- [ ] UI/UX
- [ ] Performance

## Reporting Issues

When reporting browser-specific issues, include:

1. **Browser Information**:
   - Name and version
   - Operating system and version
   - Device model (for mobile)

2. **Issue Description**:
   - What you were doing
   - What you expected
   - What actually happened

3. **Reproduction Steps**:
   - Detailed step-by-step instructions
   - Any specific conditions required

4. **Screenshots/Videos**:
   - Visual evidence of the issue
   - Console errors if applicable

5. **Frequency**:
   - Does it happen every time?
   - Intermittent or consistent?

## Automated Testing

While manual testing is required for cross-browser validation, automated tests can catch regressions:

```bash
# Run unit tests
npm run test:run

# Run integration tests
npm run test:run -- features/recording/__tests__/

# Check for TypeScript errors
npm run build
```

## Conclusion

Cross-browser testing ensures a consistent experience for all users regardless of their browser choice. Complete all tests in this guide before releasing new versions of the offline recording system.

---

**Last Updated**: November 2024  
**Version**: 2.0
