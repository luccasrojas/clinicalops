# Implementation Plan

- [-] 1. Create network status detection hook

  - Implement `useOnlineStatus` hook in `features/recording/hooks/use-online-status.ts`
  - Add event listeners for `online` and `offline` browser events
  - Return boolean state indicating current network connectivity
  - Include proper cleanup of event listeners
  - _Requirements: 1.1, 1.2, 3.4, 3.5, 3.6_

- [ ] 2. Create online status indicator component

  - Implement `OnlineStatusIndicator` component in `features/recording/components/online-status-indicator.tsx`
  - Use `useOnlineStatus` hook to get network state
  - Render badge with green dot and "Online" text when connected
  - Render badge with red/gray dot and "Offline" text when disconnected
  - Apply appropriate Tailwind styling matching existing UI patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Create audio level analysis hook

  - Implement `useAudioLevel` hook in `features/recording/hooks/use-audio-level.ts`
  - Create AudioContext and AnalyserNode when MediaStream is provided
  - Use `requestAnimationFrame` to continuously read frequency data
  - Calculate RMS (root mean square) of audio samples
  - Normalize audio level to 0-1 range
  - Return 0 when not active or no stream available
  - Include proper cleanup of AudioContext on unmount
  - Add feature detection for Web Audio API with graceful degradation
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 4. Create audio level animation component

  - Implement `AudioLevelAnimation` component in `features/recording/components/audio-level-animation.tsx`
  - Use `useAudioLevel` hook to get real-time audio levels
  - Render 5 vertical bars with rounded ends using Framer Motion
  - Scale bar heights proportionally to audio level (0-1)
  - Show idle animation when level is below threshold (< 0.05)
  - Show active animation with varying bar heights when audio detected
  - Use teal color matching brand guidelines
  - Integrate with existing microphone button visual design
  - Apply smooth transitions with Framer Motion
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 5. Create synchronization dialog component

  - Implement `SyncDialog` component in `features/recording/components/sync-dialog.tsx`
  - Use shadcn Dialog component as base
  - Create online variant with title "¿Deseas guardar y transcribir esta grabación?"
  - Add three buttons for online variant: "Guardar y Transcribir", "Guardar Localmente", "Cancelar"
  - Create offline variant with title "No hay conexión a internet"
  - Add explanation text for offline variant
  - Add two buttons for offline variant: "Guardar Localmente", "Cancelar"
  - Apply responsive design with proper spacing
  - Ensure proper ARIA labels for accessibility
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [ ] 6. Integrate new components into RecordingInterface

  - Add `useOnlineStatus` hook to RecordingInterface component
  - Add state for `showSyncDialog` and `mediaStream`
  - Capture MediaStream from `useReactMediaRecorder` and store in state
  - Add `OnlineStatusIndicator` to header section with proper positioning
  - Replace existing microphone button visual with `AudioLevelAnimation` component
  - Pass `isRecording` and `mediaStream` props to AudioLevelAnimation
  - Add `SyncDialog` component with appropriate props and handlers
  - _Requirements: 1.5, 2.6, 3.1_

- [ ] 7. Implement stop button logic with sync dialog

  - Modify `handleStop` function to show sync dialog instead of immediate action
  - Create `handleSaveAndTranscribe` function that closes dialog and calls existing upload logic
  - Create `handleSaveLocally` function that closes dialog and keeps recording in local state
  - Create `handleCancelSync` function that closes dialog
  - Wire up dialog callbacks to these handler functions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [ ] 8. Add network-aware transcription controls

  - Disable transcription button when `isOnline` is false
  - Add visual indicator (opacity/cursor) when button is disabled
  - Enable transcription button when network state changes to online
  - Update button tooltip or helper text to explain offline limitation
  - _Requirements: 3.5, 3.6_

- [ ] 9. Test and refine animations and interactions
  - Test audio level animation responds correctly to different volume levels
  - Verify smooth transitions in Framer Motion animations
  - Test network status indicator updates when toggling network in DevTools
  - Test sync dialog appears correctly when stopping recording
  - Verify all button interactions work as expected
  - Test responsive behavior on mobile devices
  - Ensure Spanish text is correct and natural
  - _Requirements: All requirements_

