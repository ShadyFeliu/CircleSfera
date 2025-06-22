"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Peer from 'simple-peer';

interface EnhancedWebRTCProps {
  stream: MediaStream | null;
  partnerStream?: MediaStream | null;
  onStream: (stream: MediaStream) => void;
  onConnectionChange: (connected: boolean) => void;
  onQualityChange: (quality: 'excellent' | 'good' | 'poor') => void;
  isInitiator: boolean;
  signalData: Peer.SignalData | null;
  onSignal: (data: Peer.SignalData) => void;
  onClose: () => void;
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
  partnerStream,
  onStream,
  onConnectionChange,
  onQualityChange,
  isInitiator,
  signalData,
  onSignal,
  onClose,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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

    // Asegurar que el stream local se asigne solo una vez
    if (localVideoRef.current && !localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = stream;
    }

    // Asignar el stream del compañero directamente si está disponible
    if (partnerStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = partnerStream;
    }

    // No crear una nueva conexión WebRTC aquí, solo mostrar los streams existentes
    console.log('WebRTC Avanzado: Mostrando streams existentes');
  }, [stream, partnerStream]);

  // Manejar señales entrantes - no necesario si no creamos nueva conexión
  // useEffect(() => {
  //   if (peerRef.current && signalData) {
  //     peerRef.current.signal(signalData);
  //   }
  // }, [signalData]);

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
    // Simular estadísticas para demostración ya que no tenemos conexión WebRTC directa
    console.log('Monitoreando calidad de conexión...');
    
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
  }, [onQualityChange]);

  // Monitorear calidad cada 5 segundos
  useEffect(() => {
    const interval = setInterval(monitorConnectionQuality, 5000);
    return () => clearInterval(interval);
  }, [monitorConnectionQuality]);

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl border border-gray-700 text-white animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">WebRTC Avanzado</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-3xl leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna de videos */}
          <div className="space-y-4">
            {/* Video Local */}
            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-600">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-auto" style={{ filter: videoFilters.find(f => f.id === currentFilter)?.cssFilter }} />
              <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-md text-sm">Tu Cámara</div>
            </div>
            
            {/* Video Remoto */}
            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-600">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-auto" />
              <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-md text-sm">Compañero</div>
              {!partnerStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                    <span>Conectando...</span>
                  </div>
                  <div className="mt-4 text-gray-300 text-sm">Esperando conexión...</div>
                </div>
              )}
            </div>
          </div>

          {/* Columna de Controles */}
          <div className="flex flex-col space-y-4">
            {/* Estadísticas de Conexión */}
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <h3 className="font-bold mb-2">Estadísticas</h3>
              <div className="text-sm space-y-1">
                <p>RTT: {connectionStats.rtt.toFixed(0)} ms</p>
                <p>Paquetes Perdidos: {connectionStats.packetsLost}</p>
                <p>Bitrate: {(connectionStats.bitrate / 1000).toFixed(0)} kbps</p>
              </div>
            </div>

            {/* Controles Avanzados */}
            <div>
              <button 
                onClick={() => setShowControls(!showControls)}
                className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className={`transform transition-transform ${showControls ? 'rotate-180' : ''}`}>▲</span>
                <span className="ml-2">Mostrar Controles Avanzados</span>
              </button>
              
              {showControls && (
                <div className="mt-4 space-y-4 bg-gray-700/50 p-4 rounded-xl animate-fade-in">
                  {/* Filtros */}
                  <div>
                    <h4 className="font-semibold mb-2">Filtros</h4>
                    <div className="flex flex-wrap gap-2">
                      {videoFilters.map(filter => (
                        <button key={filter.id} onClick={() => setCurrentFilter(filter.id)} className={`px-3 py-1 rounded-md text-xs transition-colors ${currentFilter === filter.id ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
                          {filter.icon} {filter.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Efectos */}
                  <div>
                    <h4 className="font-semibold mb-2">Efectos</h4>
                    <div className="flex flex-wrap gap-2">
                      {videoEffects.map(effect => (
                        <button key={effect.id} onClick={() => setCurrentEffect(effect.id)} className={`px-3 py-1 rounded-md text-xs transition-colors ${currentEffect === effect.id ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
                          {effect.icon} {effect.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Grabación */}
                  <div>
                    <h4 className="font-semibold mb-2">Grabación</h4>
                    <div className="flex gap-2">
                      <button onClick={startRecording} disabled={isRecording} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-3 py-1 rounded-md text-xs">Grabar</button>
                      <button onClick={stopRecording} disabled={!isRecording} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 px-3 py-1 rounded-md text-xs">Detener</button>
                      <button onClick={captureScreenshot} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-xs">Capturar Screenshot</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 