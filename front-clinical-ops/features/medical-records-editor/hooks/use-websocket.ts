'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type UseWebSocketOptions = {
  historyID: string;
  userId?: string | null;
  onMessage?: (data: Record<string, unknown>) => void;
};

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function useMedicalRecordWebSocket({
  historyID,
  userId,
  onMessage,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!historyID || !userId || !wsUrl || typeof window === 'undefined') {
      return;
    }

    const url = new URL(wsUrl);
    url.searchParams.set('historyID', historyID);
    url.searchParams.set('userId', userId);

    const animationFrame = requestAnimationFrame(() => setStatus('connecting'));
    let socket: WebSocket;
    try {
      socket = new WebSocket(url.toString());
    } catch (error) {
      cancelAnimationFrame(animationFrame);
      requestAnimationFrame(() => setStatus('error'));
      console.error('Failed to establish WebSocket connection', error);
      return;
    }
    wsRef.current = socket;

    socket.onopen = () => setStatus('connected');
    socket.onclose = () => setStatus('idle');
    socket.onerror = () => setStatus('error');
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.action === 'update' && payload.historyID === historyID) {
          queryClient.invalidateQueries({ queryKey: ['medical-record', historyID] });
        }
        onMessage?.(payload);
      } catch (error) {
        console.error('Invalid WebSocket message', error);
      }
    };

    return () => {
      cancelAnimationFrame(animationFrame);
      socket.close();
    };
  }, [historyID, userId, onMessage, queryClient]);

  return {
    status,
    isConnected: status === 'connected',
  };
}
