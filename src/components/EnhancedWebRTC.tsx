"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Peer from 'simple-peer';

interface EnhancedWebRTCProps {
  stream: MediaStream | null;
  onStream: (stream: MediaStream) => void;
  onConnectionChange: (connected: boolean) => void;
  onQualityChange: (quality: 'excellent' | 'good' | 'poor') => void;
  isInitiator: boolean;
  signalData: Peer.SignalData | null;
  onSignal: (data: Peer.SignalData) => void;
}

interface VideoFilter {
  id: string;
  name: string;
  cssFilter: string;
  icon: string;
}

interface VideoEffect {
  id: string;
  name: string;
  icon: string;
  apply: (video: HTMLVideoElement) => void;
  remove: (video: HTMLVideoElement) => void;
}

export const EnhancedWebRTC: React.FC<EnhancedWebRTCProps> = ({
  stream,
  onStream,
  onConnectionChange,
  onQualityChange,
  isInitiator,
  signalData,
  onSignal
}) => {
  const peerRef = useRef<Peer.Instance | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('none');
  const [currentEffect, setCurrentEffect] = useState<string>('none');
  const [connectionStats, setConnectionStats] = useState({
    rtt: 0,
    packetsLost: 0,
    bitrate: 0
  });
  const [showControls, setShowControls] = useState(false);

  // Filtros de video
  const videoFilters: VideoFilter[] = useMemo(() => [
    { id: 'none', name: 'Normal', cssFilter: 'none', icon: '👤' },
    { id: 'grayscale', name: 'Blanco y Negro', cssFilter: 'grayscale(100%)', icon: '⚫' },
    { id: 'sepia', name: 'Sepia', cssFilter: 'sepia(100%)', icon: '🟤' },
    { id: 'blur', name: 'Desenfoque', cssFilter: 'blur(2px)', icon: '🌫️' },
    { id: 'brightness', name: 'Brillo', cssFilter: 'brightness(150%)', icon: '☀️' },
    { id: 'contrast', name: 'Contraste', cssFilter: 'contrast(150%)', icon: '🎨' },
    { id: 'hue-rotate', name: 'Tono', cssFilter: 'hue-rotate(90deg)', icon: '🌈' },
    { id: 'invert', name: 'Invertir', cssFilter: 'invert(100%)', icon: '🔄' }
  ], []);

  // Efectos de video
  const videoEffects: VideoEffect[] = useMemo(() => [
    {
      id: 'mirror',
      name: 'Espejo',
      icon: '🪞',
      apply: (video) => video.style.transform = 'scaleX(-1)',
      remove: (video) => video.style.transform = 'scaleX(1)'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      icon: '🔍',
      apply: (video) => video.style.transform = 'scale(1.2)',
      remove: (video) => video.style.transform = 'scale(1)'
    },
    {
      id: 'rotate',
      name: 'Rotar',
      icon: '🔄',
      apply: (video) => video.style.transform = 'rotate(90deg)',
      remove: (video) => video.style.transform = 'rotate(0deg)'
    }
  ], []);

  // Configuración de WebRTC mejorada
  const rtcConfig = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Servidores TURN públicos (para casos extremos)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  }), []);

  // Inicializar WebRTC
  useEffect(() => {
    if (!stream) return;

    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      config: rtcConfig,
      stream: stream
    });

    peerRef.current = peer;

    peer.on('signal', (data) => {
      onSignal(data);
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        onStream(remoteStream);
      }
    });

    peer.on('connect', () => {
      setIsConnected(true);
      onConnectionChange(true);
      console.log('WebRTC conectado');
    });

    peer.on('close', () => {
      setIsConnected(false);
      onConnectionChange(false);
      console.log('WebRTC desconectado');
    });

    peer.on('error', (err) => {
      console.error('Error de WebRTC:', err);
      onConnectionChange(false);
    });

    return () => {
      peer.destroy();
    };
  }, [stream, isInitiator, onSignal, onStream, onConnectionChange, rtcConfig]);

  // Manejar señales entrantes
  useEffect(() => {
    if (peerRef.current && signalData) {
      peerRef.current.signal(signalData);
    }
  }, [signalData]);

  // Aplicar filtro al video local
  useEffect(() => {
    if (localVideoRef.current) {
      const filter = videoFilters.find(f => f.id === currentFilter);
      if (filter) {
        localVideoRef.current.style.filter = filter.cssFilter;
      }
    }
  }, [currentFilter, videoFilters]);

  // Aplicar efecto al video local
  useEffect(() => {
    if (localVideoRef.current) {
      // Remover efecto anterior
      videoEffects.forEach(effect => {
        effect.remove(localVideoRef.current!);
      });

      // Aplicar nuevo efecto
      const effect = videoEffects.find(e => e.id === currentEffect);
      if (effect && currentEffect !== 'none') {
        effect.apply(localVideoRef.current);
      }
    }
  }, [currentEffect, videoEffects]);

  // Monitorear calidad de conexión
  const monitorConnectionQuality = useCallback(async () => {
    if (!peerRef.current || !isConnected) return;

    try {
      // Nota: simple-peer no tiene getStats nativo, esto es un placeholder
      // En una implementación real, necesitarías usar RTCPeerConnection directamente
      console.log('Monitoreando calidad de conexión...');
      
      // Simular estadísticas para demostración
      const mockStats = {
        rtt: Math.random() * 200 + 50,
        packetsLost: Math.floor(Math.random() * 10),
        bitrate: Math.random() * 1000000 + 500000
      };

      setConnectionStats(mockStats);

      // Determinar calidad basada en métricas simuladas
      let quality: 'excellent' | 'good' | 'poor' = 'good';
      if (mockStats.rtt < 100 && mockStats.packetsLost < 5) {
        quality = 'excellent';
      } else if (mockStats.rtt > 300 || mockStats.packetsLost > 20) {
        quality = 'poor';
      }

      onQualityChange(quality);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }, [isConnected, onQualityChange]);

  // Monitorear calidad cada 5 segundos
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(monitorConnectionQuality, 5000);
    return () => clearInterval(interval);
  }, [isConnected, monitorConnectionQuality]);

  // Funciones de grabación
  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circlesfera-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    setIsRecording(true);
  }, [stream, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Capturar screenshot
  const captureScreenshot = useCallback(() => {
    if (!localVideoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = localVideoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `circlesfera-screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, []);

  return (
    <div className="relative">
      {/* Videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Video Local */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-64 md:h-80 object-cover rounded-lg bg-gray-900"
            style={{ filter: currentFilter !== 'none' ? videoFilters.find(f => f.id === currentFilter)?.cssFilter : 'none' }}
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Tú
          </div>
        </div>

        {/* Video Remoto */}
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-64 md:h-80 object-cover rounded-lg bg-gray-900"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {isConnected ? 'Conectado' : 'Conectando...'}
          </div>
        </div>
      </div>

      {/* Canvas oculto para screenshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controles */}
      <div className="space-y-4">
        {/* Botón para mostrar/ocultar controles */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="btn-secondary w-full"
        >
          {showControls ? '🔽 Ocultar Controles' : '🔼 Mostrar Controles'}
        </button>

        {showControls && (
          <div className="space-y-4 fade-in">
            {/* Filtros */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Filtros de Video
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {videoFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setCurrentFilter(filter.id)}
                    className={`p-2 rounded-lg border transition-all ${
                      currentFilter === filter.id
                        ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{filter.icon}</div>
                    <div className="text-xs">{filter.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Efectos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Efectos
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {videoEffects.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setCurrentEffect(currentEffect === effect.id ? 'none' : effect.id)}
                    className={`p-2 rounded-lg border transition-all ${
                      currentEffect === effect.id
                        ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-400 dark:text-purple-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{effect.icon}</div>
                    <div className="text-xs">{effect.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grabación y Screenshots */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`btn-primary ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {isRecording ? '⏹️ Detener Grabación' : '🎥 Iniciar Grabación'}
              </button>
              <button
                onClick={captureScreenshot}
                className="btn-secondary"
              >
                📸 Capturar Screenshot
              </button>
            </div>

            {/* Estadísticas de Conexión */}
            {isConnected && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Estadísticas de Conexión
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(connectionStats.rtt)}ms
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Latencia</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {connectionStats.packetsLost}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Paquetes Perdidos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(connectionStats.bitrate / 1024)}KB/s
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Bitrate</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 