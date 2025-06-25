'use client';
import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export type SocketStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

// Utilidad para obtener la URL de señalización de forma robusta
function getSignalingUrl() {
  console.log('[getSignalingUrl] window.location.hostname:', typeof window !== 'undefined' ? window.location.hostname : 'undefined');
  console.log('[getSignalingUrl] process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('[getSignalingUrl] process.env.NEXT_PUBLIC_SOCKET_URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && process.env.NODE_ENV === 'production') {
    console.log('[getSignalingUrl] Usando URL de producción: https://api.circlesfera.com');
    return 'https://api.circlesfera.com';
  }
  const fallbackUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  console.log('[getSignalingUrl] Usando URL de fallback:', fallbackUrl);
  return fallbackUrl;
}

export function useSocket(url?: string, opts?: Record<string, unknown>) {
  const socketUrl = url || getSignalingUrl();
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    if (!socketUrl) {
      console.error('[useSocket] URL de señalización no definida.');
      setStatus('failed');
      return;
    }
    console.log('[useSocket] Conectando a:', socketUrl);
    const socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: MAX_RETRIES,
      ...opts,
    });
    socketRef.current = socket;

    const onConnect = () => {
      setStatus('connected');
      setRetries(0);
    };
    const onDisconnect = () => {
      setStatus('disconnected');
    };
    const onReconnectAttempt = (attempt: number) => {
      setStatus('reconnecting');
      setRetries(attempt);
    };
    const onReconnectFailed = () => {
      setStatus('failed');
    };
    const onReconnect = () => {
      setStatus('connected');
      setRetries(0);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_failed', onReconnectFailed);
    socket.on('reconnect', onReconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect_failed', onReconnectFailed);
      socket.off('reconnect', onReconnect);
      socket.disconnect();
    };
  }, [socketUrl, opts]);

  return { socket: socketRef.current, status, retries };
} 