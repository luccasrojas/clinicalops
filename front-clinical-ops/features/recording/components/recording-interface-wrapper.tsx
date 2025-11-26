'use client'

import { featureFlags } from '@/lib/feature-flags'
import { RecordingInterface } from './recording-interface'
import { RecordingInterfaceLegacy } from './recording-interface-legacy'

type RecordingInterfaceWrapperProps = {
  doctorID: string
  onComplete?: (historyID: string) => void
  onError?: (error: string) => void
}

/**
 * Wrapper component that switches between new offline-capable recording interface
 * and legacy implementation based on feature flag
 */
export function RecordingInterfaceWrapper(
  props: RecordingInterfaceWrapperProps,
) {
  // Use feature flag to determine which implementation to render
  if (featureFlags.enableOfflineRecording) {
    return <RecordingInterface {...props} />
  }

  return <RecordingInterfaceLegacy {...props} />
}
