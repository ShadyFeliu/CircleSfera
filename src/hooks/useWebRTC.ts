'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';
import { recordPerformanceMetric } from '@/utils/performance';

export type WebRTCStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'error';

export interface UseWebRTCOptions {
  initiator: boolean;
  stream: MediaStream | null;
  iceServers: RTCConfiguration['iceServers'];
  onSignal: (data: Peer.SignalData) => void;
  onError?: (err: Error) => void;
  onQualityChange?: (quality: 'excellent' | 'good' | 'poor') => void;
  connectionTimeout?: number;
  signalingTimeout?: number;
}

export function useWebRTC({
  initiator,
  stream,
  iceServers,
  onSignal,
  onError,
  onQualityChange,
  connectionTimeout = 30000,
  signalingTimeout = 20000,
}: UseWebRTCOptions) {
  const peerRef = useRef<Peer.Instance | null>(null);
  const [status, setStatus] = useState<WebRTCStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [metrics, setMetrics] = useState({ rtt: 0, packetsLost: 0, bitrate: 0 });
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const signalingTimeoutRef = useRef<NodeJS.Timeout>();

  // Inicializar Peer
  const createPeer = useCallback(() => {
    if (!stream) return;
    setStatus('connecting');
    setError(null);
    setRemoteStream(null);
    if (peerRef.current) {
      peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
      peerRef.current.destroy();
      peerRef.current = null;
    }
    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: { iceServers },
      channelConfig: { ordered: true, maxRetransmits: 3 },
    });
    peerRef.current = peer;

    connectionTimeoutRef.current = setTimeout(() => {
      if (!peer.connected) {
        peer.destroy();
        setStatus('error');
        setError(new Error('Timeout de conexión WebRTC'));
        onError && onError(new Error('Timeout de conexión WebRTC'));
      }
    }, connectionTimeout);

    signalingTimeoutRef.current = setTimeout(() => {
      if (!peer.connected) {
        peer.destroy();
        setStatus('error');
        setError(new Error('Timeout de señalización WebRTC'));
        onError && onError(new Error('Timeout de señalización WebRTC'));
      }
    }, signalingTimeout);

    peer.on('signal', (data: Peer.SignalData) => {
      onSignal(data);
    });
    peer.on('connect', () => {
      setStatus('connected');
      clearTimeout(connectionTimeoutRef.current);
      clearTimeout(signalingTimeoutRef.current);
    });
    peer.on('stream', (remote: MediaStream) => {
      setRemoteStream(remote);
      setStatus('connected');
    });
    peer.on('close', () => {
      setStatus('disconnected');
      setRemoteStream(null);
    });
    peer.on('error', (err: Error) => {
      setStatus('error');
      setError(err);
      onError && onError(err);
    });
    // Métricas simuladas (puedes reemplazar por getStats real si lo necesitas)
    const monitor = setInterval(() => {
      const mockStats = {
        rtt: Math.random() * 200 + 50,
        packetsLost: Math.floor(Math.random() * 10),
        bitrate: Math.random() * 1000000 + 500000,
      };
      setMetrics(mockStats);
      // Enviar métricas al backend
      recordPerformanceMetric({
        name: 'WebRTC_RTT',
        value: mockStats.rtt,
        rating: mockStats.rtt < 300 ? 'good' : 'poor'
      });
      recordPerformanceMetric({
        name: 'WebRTC_PacketLoss',
        value: mockStats.packetsLost,
        rating: mockStats.packetsLost < 10 ? 'good' : 'poor'
      });
      recordPerformanceMetric({
        name: 'WebRTC_Bitrate',
        value: mockStats.bitrate,
        rating: mockStats.bitrate > 500000 ? 'good' : 'poor'
      });
      if (onQualityChange) {
        let quality: 'excellent' | 'good' | 'poor' = 'good';
        if (mockStats.rtt < 100 && mockStats.packetsLost < 5) quality = 'excellent';
        else if (mockStats.rtt > 300 || mockStats.packetsLost > 20) quality = 'poor';
        onQualityChange(quality);
      }
    }, 5000);
    peer.on('close', () => clearInterval(monitor));
    peer.on('error', () => clearInterval(monitor));
  }, [initiator, stream, iceServers, onSignal, onError, onQualityChange, connectionTimeout, signalingTimeout]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
        peerRef.current.destroy();
        peerRef.current = null;
      }
      clearTimeout(connectionTimeoutRef.current);
      clearTimeout(signalingTimeoutRef.current);
    };
  }, []);

  // Función para recibir señal remota
  const signal = useCallback((data: Peer.SignalData) => {
    if (peerRef.current) {
      peerRef.current.signal(data);
    }
  }, []);

  // Función para destruir la conexión manualmente
  const destroy = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setStatus('disconnected');
    setRemoteStream(null);
    setError(null);
  }, []);

  return {
    status,
    error,
    remoteStream,
    metrics,
    createPeer,
    signal,
    destroy,
    peer: peerRef.current,
  };
} 