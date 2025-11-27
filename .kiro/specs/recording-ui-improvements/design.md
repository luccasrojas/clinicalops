# Design Document

## Overview

This design document describes the technical implementation for three UI improvements to the Recording Interface: (1) an Online/Offline status indicator, (2) a real-time audio level visualization animation, and (3) an intelligent synchronization dialog that appears when stopping recordings. The solution leverages React hooks for network detection, Web Audio API for audio analysis, and a custom dialog component for the sync prompt.

## Architecture

### Component Structure

```
RecordingInterface (existing)
├── OnlineStatusIndicator (new)
├── AudioLevelAnimation (new - replaces/enhances existing mic button)
├── SyncDialog (new)
└── existing recording controls
```

### Data Flow

1. **Network State**: `useOnlineStatus` custom hook monitors `navigator.onLine` and network events → provides boolean state to components
2. **Audio Analysis**: `useAudioLevel` custom hook connects to MediaStream → analyzes audio via Web Audio API → provides normalized level (0-1) to animation component
3. **Sync Logic**: When "Detener" is clicked → check network state → show appropriate dialog variant → handle user choice

## Components and Interfaces

### 1. OnlineStatusIndicator Component

**Location**: `front-clinical-ops/features/recording/components/online-status-indicator.tsx`

**Props**:

```typescript
interface OnlineStatusIndicatorProps {
  className?: string;
}
```

**Implementation**:

- Uses `useOnlineStatus()` hook
- Renders a badge with icon + text
- Green dot + "Online" when connected
- Red/gray dot + "Offline" when disconnected
- Positioned in top-right of recording interface header

### 2. useOnlineStatus Hook

**Location**: `front-clinical-ops/features/recording/hooks/use-online-status.ts`

**Interface**:

```typescript
export function useOnlineStatus(): boolean;
```

**Implementation**:

- Initializes with `navigator.onLine`
- Adds event listeners for `online` and `offline` events
- Returns current online state
- Cleans up listeners on unmount

### 3. AudioLevelAnimation Component

**Location**: `front-clinical-ops/features/recording/components/audio-level-animation.tsx`

**Props**:

```typescript
interface AudioLevelAnimationProps {
  isRecording: boolean;
  mediaStream: MediaStream | null;
  className?: string;
}
```

**Implementation**:

- Uses `useAudioLevel(mediaStream, isRecording)` hook
- Renders animated bars/circles that scale based on audio level
- Design inspired by ChatGPT voice input (3-5 vertical bars with varying heights)
- Uses Framer Motion for smooth animations
- Idle state when level is below threshold (< 0.05)
- Active state scales bars proportionally to level

### 4. useAudioLevel Hook

**Location**: `front-clinical-ops/features/recording/hooks/use-audio-level.ts`

**Interface**:

```typescript
export function useAudioLevel(
  mediaStream: MediaStream | null,
  isActive: boolean
): number; // Returns 0-1 normalized level
```

**Implementation**:

- Creates AudioContext and AnalyserNode when stream is available
- Connects stream to analyser
- Uses `requestAnimationFrame` to continuously read frequency data
- Calculates RMS (root mean square) of audio samples
- Normalizes to 0-1 range
- Returns 0 when not active or no stream
- Cleans up audio context on unmount

### 5. SyncDialog Component

**Location**: `front-clinical-ops/features/recording/components/sync-dialog.tsx`

**Props**:

```typescript
interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOnline: boolean;
  onSaveAndTranscribe: () => void;
  onSaveLocally: () => void;
  onCancel: () => void;
}
```

**Implementation**:

- Uses shadcn Dialog component
- Two variants based on `isOnline` prop:
  - **Online variant**: Shows "¿Deseas guardar y transcribir esta grabación?" with buttons "Guardar y Transcribir", "Guardar Localmente", "Cancelar"
  - **Offline variant**: Shows "No hay conexión a internet" message with explanation, only "Guardar Localmente" and "Cancelar" buttons
- Responsive design with proper spacing and Spanish text

### 6. RecordingInterface Updates

**Changes to existing component**:

1. **Add hooks**:

```typescript
const isOnline = useOnlineStatus();
const [showSyncDialog, setShowSyncDialog] = useState(false);
const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
```

2. **Capture MediaStream**:

- Modify `useReactMediaRecorder` to expose the stream
- Store in state for audio level analysis

3. **Update handleStop**:

```typescript
const handleStop = () => {
  stopRecording();
  setShowSyncDialog(true); // Show dialog instead of immediate action
};
```

4. **Add dialog handlers**:

```typescript
const handleSaveAndTranscribe = () => {
  setShowSyncDialog(false);
  handleUploadAndProcess(); // existing function
};

const handleSaveLocally = () => {
  setShowSyncDialog(false);
  // Keep recording in mediaBlobUrl, don't upload
};

const handleCancelSync = () => {
  setShowSyncDialog(false);
  // Optionally clear recording or keep it
};
```

5. **Disable transcribe button when offline**:

```typescript
<Button
  onClick={handleUploadAndProcess}
  disabled={!isOnline || isUploading || isProcessing}
  // ... rest of props
>
```

6. **Replace microphone button with AudioLevelAnimation**:

```typescript
<AudioLevelAnimation isRecording={isRecording} mediaStream={mediaStream} />
```

7. **Add OnlineStatusIndicator to header**:

```typescript
<header className='flex w-full mb-12 flex-col items-center gap-4 sm:gap-6'>
  <div className='flex items-center justify-between w-full'>
    <h2>...</h2>
    <OnlineStatusIndicator />
  </div>
  <p>...</p>
</header>
```

## Data Models

### Audio Level Data

```typescript
interface AudioLevelData {
  level: number; // 0-1 normalized
  timestamp: number;
}
```

### Network State

```typescript
type NetworkState = boolean; // true = online, false = offline
```

## Error Handling

1. **Web Audio API not available**: Gracefully degrade to static animation
2. **MediaStream access fails**: Show error toast, fall back to existing UI
3. **Network state detection fails**: Assume online (safer default for functionality)
4. **Dialog interaction errors**: Log to console, close dialog on any error

## Testing Strategy

### Unit Tests

1. **useOnlineStatus hook**:

   - Test initial state matches `navigator.onLine`
   - Test state updates on `online`/`offline` events
   - Test cleanup of event listeners

2. **useAudioLevel hook**:

   - Mock AudioContext and AnalyserNode
   - Test returns 0 when not active
   - Test returns normalized values when active
   - Test cleanup of audio context

3. **OnlineStatusIndicator component**:

   - Test renders "Online" when online
   - Test renders "Offline" when offline
   - Test correct styling for each state

4. **AudioLevelAnimation component**:

   - Test renders idle state when level is low
   - Test renders active state when level is high
   - Test animation scales with level

5. **SyncDialog component**:
   - Test online variant shows all three buttons
   - Test offline variant shows limited buttons
   - Test button callbacks are invoked correctly

### Integration Tests

1. Test RecordingInterface with new components integrated
2. Test network state changes during recording
3. Test stop → dialog → save flow
4. Test stop → dialog → cancel flow
5. Test transcribe button disabled when offline

### Manual Testing Checklist

- [ ] Record audio and verify animation responds to voice
- [ ] Toggle network (Chrome DevTools) and verify status indicator updates
- [ ] Stop recording while online and verify dialog appears with all options
- [ ] Stop recording while offline and verify dialog shows offline message
- [ ] Verify transcribe button is disabled when offline
- [ ] Test on mobile devices for responsive behavior
- [ ] Test with different audio input levels (whisper, normal, loud)

## Implementation Notes

1. **Performance**: Use `requestAnimationFrame` throttling in audio level hook to avoid excessive re-renders (target 30-60 fps)
2. **Accessibility**: Ensure dialog has proper ARIA labels and keyboard navigation
3. **Browser Compatibility**: Web Audio API is widely supported, but add feature detection
4. **Spanish Language**: All UI text must be in Spanish, matching existing patterns
5. **Styling**: Use existing Tailwind classes and shadcn components for consistency
6. **Animation**: Keep animations smooth with Framer Motion, avoid janky transitions

## Visual Design Reference

### Audio Level Animation (ChatGPT-style)

```
Idle state:
| | | | |  (short bars, minimal movement)

Active state (low volume):
| || | || |  (bars grow slightly)

Active state (high volume):
|| ||| |||| ||| ||  (bars grow significantly, more variation)
```

Use 5 vertical bars with rounded ends, teal color matching brand, smooth height transitions.

### Online Status Indicator

```
Online:  ● Online  (green dot + text)
Offline: ● Offline (red/gray dot + text)
```

Small badge in top-right corner, subtle shadow, matches existing UI patterns.

### Sync Dialog

```
┌─────────────────────────────────────┐
│  ¿Deseas guardar y transcribir?     │
│                                     │
│  [Guardar y Transcribir]            │
│  [Guardar Localmente]               │
│  [Cancelar]                         │
└─────────────────────────────────────┘
```

Center-aligned, responsive, clear hierarchy with primary action emphasized.

