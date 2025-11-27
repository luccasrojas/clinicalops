# Requirements Document

## Introduction

This document outlines the requirements for improving the recording interface UI in the ClinicalOps application. The improvements focus on three key areas: (1) replacing the "4G" indicator with a clearer "Online" status, (2) implementing a ChatGPT-style audio input animation that responds to actual audio levels, and (3) adding intelligent synchronization logic that prompts the user to save when stopping a recording if internet is available, while blocking transcription when offline.

## Glossary

- **Recording_Interface**: The React component (`RecordingInterface`) that handles audio recording, file uploads, and transcription initiation for clinical histories.
- **Online_Status_Indicator**: A UI element that displays the current network connectivity state to the user.
- **Audio_Level_Animation**: A visual animation that responds in real-time to the microphone input volume, similar to ChatGPT's voice input visualization.
- **Sync_Dialog**: A modal dialog that appears when the user stops recording, prompting them to save/transcribe if online or informing them of offline status.
- **Network_State**: The browser's online/offline connectivity status, detected via `navigator.onLine` and network events.

## Requirements

### Requirement 1

**User Story:** As a clinician, I want to see a clear "Online" status indicator instead of "4G", so that I immediately understand my connectivity state without technical jargon.

#### Acceptance Criteria

1. WHEN the Recording_Interface renders, THE Online_Status_Indicator SHALL display "Online" text when Network_State is connected.
2. WHEN Network_State changes to disconnected, THE Online_Status_Indicator SHALL display "Offline" text.
3. THE Online_Status_Indicator SHALL use a green color indicator when online.
4. THE Online_Status_Indicator SHALL use a red or gray color indicator when offline.
5. THE Online_Status_Indicator SHALL be positioned in a visible location within the Recording_Interface header area.

### Requirement 2

**User Story:** As a clinician, I want to see a visual animation that responds to my voice input during recording, so that I can confirm the microphone is capturing audio properly.

#### Acceptance Criteria

1. WHEN the Recording_Interface is in recording state, THE Audio_Level_Animation SHALL display animated visual elements.
2. THE Audio_Level_Animation SHALL respond to real-time audio input levels from the microphone.
3. THE Audio_Level_Animation SHALL use a design pattern similar to ChatGPT's voice input (e.g., animated bars, waves, or pulsing circles).
4. WHEN no audio input is detected, THE Audio_Level_Animation SHALL display minimal or idle animation.
5. WHEN audio input is detected, THE Audio_Level_Animation SHALL increase in intensity proportional to the audio volume.
6. THE Audio_Level_Animation SHALL integrate with the existing microphone button visual design.

### Requirement 3

**User Story:** As a clinician, I want the app to intelligently handle synchronization when I stop recording, so that I can save my work when online and understand limitations when offline.

#### Acceptance Criteria

1. WHEN the user clicks "Detener" (Stop) button AND Network_State is online, THE Sync_Dialog SHALL appear asking if the user wants to save and transcribe.
2. WHEN the user confirms save in Sync_Dialog AND Network_State is online, THE Recording_Interface SHALL proceed with upload and transcription.
3. WHEN the user declines save in Sync_Dialog, THE Recording_Interface SHALL retain the recording locally without uploading.
4. WHEN the user clicks "Detener" button AND Network_State is offline, THE Sync_Dialog SHALL inform the user that transcription is unavailable offline.
5. WHEN Network_State is offline, THE Recording_Interface SHALL disable the transcription button.
6. WHEN Network_State changes from offline to online AND a recording exists, THE Recording_Interface SHALL enable the transcription button.
7. THE Sync_Dialog SHALL provide clear action buttons with Spanish labels ("Guardar y Transcribir", "Guardar Localmente", "Cancelar").

