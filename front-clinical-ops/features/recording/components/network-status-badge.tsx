'use client';

import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { useNetworkStatus } from '../hooks/use-network-status';
import { cn } from '@/lib/utils';

interface NetworkStatusBadgeProps {
  className?: string;
  showConnectionType?: boolean;
}

/**
 * Badge component that displays the current network connectivity status
 * Shows online/offline state with appropriate colors and connection type when available
 */
export function NetworkStatusBadge({
  className,
  showConnectionType = true,
}: NetworkStatusBadgeProps) {
  const { isOnline, connectionType, effectiveType, isSlowConnection } =
    useNetworkStatus();

  const getConnectionLabel = () => {
    if (!isOnline) return 'Sin conexión';
    
    if (!showConnectionType) return 'En línea';

    // Show connection type if available
    if (connectionType !== 'unknown') {
      if (connectionType === 'wifi') return 'WiFi';
      return connectionType.toUpperCase();
    }

    // Fallback to effective type
    if (effectiveType) {
      return effectiveType.toUpperCase();
    }

    return 'En línea';
  };

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className='h-3 w-3' />;
    }

    if (isSlowConnection) {
      return <Signal className='h-3 w-3' />;
    }

    return <Wifi className='h-3 w-3' />;
  };

  const getVariant = () => {
    if (!isOnline) return 'destructive';
    if (isSlowConnection) return 'warning';
    return 'success';
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn('gap-1.5', className)}
      aria-label={`Estado de conexión: ${getConnectionLabel()}`}
    >
      {getIcon()}
      <span>{getConnectionLabel()}</span>
    </Badge>
  );
}
