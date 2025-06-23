'use client';
import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export type SocketStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export function useSocket(url: string, opts?: Record<string, unknown>) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    const socket = io(url, {
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
  }, [url, opts]);

  return { socket: socketRef.current, status, retries };
} 