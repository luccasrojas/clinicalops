/**
 * Feature flags configuration
 * Centralized place to manage feature toggles
 */

export const featureFlags = {
  /**
   * Enable offline recording functionality with IndexedDB storage and sync
   * When disabled, falls back to the old react-media-recorder implementation
   */
  enableOfflineRecording:
    process.env.NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING === 'true',
} as const

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature]
}
