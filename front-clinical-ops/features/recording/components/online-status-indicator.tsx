'use client'

import { cn } from '@/lib/utils'
import { useOnlineStatus } from '../hooks/use-online-status'

interface OnlineStatusIndicatorProps {
  className?: string
}

/**
 * OnlineStatusIndicator displays the current network connectivity state
 * Shows "Online" with green indicator when connected
 * Shows "Offline" with red/gray indicator when disconnected
 */
export function OnlineStatusIndicator({
  className,
}: OnlineStatusIndicatorProps) {
  const isOnline = useOnlineStatus()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors',
        isOnline
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-300 bg-gray-100 text-gray-600',
        className,
      )}
      role='status'
      aria-live='polite'
      aria-label={isOnline ? 'Conectado a internet' : 'Sin conexión a internet'}
    >
      {/* Status indicator dot */}
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-gray-400',
        )}
        aria-hidden='true'
      />

      {/* Status text */}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  )
}
