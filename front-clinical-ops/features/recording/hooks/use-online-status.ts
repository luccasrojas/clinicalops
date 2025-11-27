import { useEffect, useState } from 'react'

/**
 * Custom hook to detect network connectivity status
 * Monitors browser online/offline events and returns current network state
 *
 * @returns {boolean} true if online, false if offline
 */
export function useOnlineStatus(): boolean {
  // Initialize with current browser online status
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    // Handler for when network comes online
    const handleOnline = () => {
      setIsOnline(true)
    }

    // Handler for when network goes offline
    const handleOffline = () => {
      setIsOnline(false)
    }

    // Add event listeners for network status changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup: remove event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
