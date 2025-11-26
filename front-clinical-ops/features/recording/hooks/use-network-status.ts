import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
}

const STORAGE_KEY = 'clinicalops:network:last-status';
const DEBOUNCE_MS = 1000;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Hook to monitor network connectivity status
 * Listens to online/offline events and uses Network Information API when available
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Initialize from localStorage or navigator
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : navigator.onLine;
    }
    return true;
  });

  const [connectionInfo, setConnectionInfo] = useState<{
    type: 'wifi' | '4g' | '3g' | '2g' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  }>({
    type: 'unknown',
    effectiveType: '4g',
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced status update
  const updateOnlineStatus = useCallback((online: boolean) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsOnline(online);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(online));
      }
    }, DEBOUNCE_MS);
  }, []);

  // Health check to verify real connectivity
  const performHealthCheck = useCallback(async () => {
    if (!navigator.onLine) {
      updateOnlineStatus(false);
      return;
    }

    try {
      // Ping a reliable endpoint with no-cache headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      updateOnlineStatus(response.ok);
    } catch (error) {
      // If health check fails, we're likely offline
      updateOnlineStatus(false);
    }
  }, [updateOnlineStatus]);

  // Update connection info from Network Information API
  const updateConnectionInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType || '4g';
      let type: 'wifi' | '4g' | '3g' | '2g' | 'unknown' = 'unknown';

      if (connection.type) {
        if (connection.type === 'wifi') type = 'wifi';
        else if (connection.type === 'cellular') {
          // Try to infer from effectiveType
          if (effectiveType.includes('4g')) type = '4g';
          else if (effectiveType.includes('3g')) type = '3g';
          else if (effectiveType.includes('2g')) type = '2g';
        }
      }

      setConnectionInfo({
        type,
        effectiveType,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial health check
    performHealthCheck();

    // Set up event listeners
    const handleOnline = () => {
      updateOnlineStatus(true);
      performHealthCheck();
    };

    const handleOffline = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Set up periodic health checks
    healthCheckIntervalRef.current = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [performHealthCheck, updateOnlineStatus, updateConnectionInfo]);

  const isSlowConnection = connectionInfo.effectiveType === 'slow-2g' || 
                          connectionInfo.effectiveType === '2g';

  return {
    isOnline,
    isSlowConnection,
    connectionType: connectionInfo.type,
    effectiveType: connectionInfo.effectiveType,
  };
}
