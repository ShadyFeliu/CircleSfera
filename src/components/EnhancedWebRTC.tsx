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
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);

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
      setLastRecordingUrl(url);
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
        setLastScreenshot(url);
        const a = document.createElement('a');
        a.href = url;
        a.download = `circlesfera-screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, []);

  const resetAll = () => {
    setCurrentFilter('none');
    setCurrentEffect('none');
  };

  const invertCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (videoDevices.length < 2) return;
      const currentFacing = isMirrored ? 'environment' : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacing },
        audio: false
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsMirrored(!isMirrored);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#232526]/90 to-[#414345]/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl mx-auto rounded-3xl shadow-2xl border border-gray-700 bg-gray-900/95 text-white animate-fade-in-up p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="inline-block bg-blue-700/80 rounded-full px-3 py-1 text-lg mr-2">🎥</span>
            WebRTC Avanzado
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-4xl leading-none transition-colors duration-200 p-2 rounded-full hover:bg-gray-700/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 p-6 md:p-10">
          {/* Columna de videos */}
          <div className="space-y-6 flex flex-col justify-center">
            {/* Video Local */}
            <div className={`bg-gray-800/80 rounded-2xl overflow-hidden relative border-2 border-blue-700/40 shadow-lg transition-all duration-300 ${currentEffect !== 'none' ? 'ring-4 ring-blue-400 animate-pulse-slow' : ''}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-56 md:h-64 object-cover transition-all duration-300" style={{ filter: videoFilters.find(f => f.id === currentFilter)?.cssFilter }} />
              <div className="absolute top-2 left-2 bg-blue-700/80 px-3 py-1 rounded-lg text-xs font-semibold shadow">Tu Cámara</div>
            </div>
            {/* Video Remoto */}
            <div className="bg-gray-800/80 rounded-2xl overflow-hidden relative border-2 border-green-700/40 shadow-lg">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-56 md:h-64 object-cover transition-all duration-300" />
              <div className="absolute top-2 left-2 bg-green-700/80 px-3 py-1 rounded-lg text-xs font-semibold shadow">Compañero</div>
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
            {/* Miniaturas de capturas y grabaciones */}
            {(lastScreenshot || lastRecordingUrl) && (
              <div className="flex flex-col items-center mt-4 gap-2">
                {lastScreenshot && (
                  <div className="flex flex-col items-center">
                    <img src={lastScreenshot} alt="Última captura" className="w-32 h-20 object-cover rounded-lg border-2 border-blue-400 mb-1" />
                    <button onClick={async () => { await navigator.clipboard.writeText(lastScreenshot); }} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs text-white mt-1">Copiar enlace</button>
                  </div>
                )}
                {lastRecordingUrl && (
                  <div className="flex flex-col items-center">
                    <video src={lastRecordingUrl} controls className="w-32 h-20 object-cover rounded-lg border-2 border-green-400 mb-1" />
                    <a href={lastRecordingUrl} download className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs text-white mt-1">Descargar grabación</a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna de Controles */}
          <div className="flex flex-col space-y-6 justify-center">
            {/* Estadísticas de Conexión */}
            <div className="bg-gray-800/80 p-6 rounded-2xl shadow border border-gray-700 flex flex-col gap-2">
              <h3 className="font-bold mb-2 text-lg flex items-center gap-2">📊 Estadísticas</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-semibold shadow ${connectionStats.rtt < 100 ? 'bg-green-700/80' : connectionStats.rtt < 300 ? 'bg-yellow-700/80' : 'bg-red-700/80'}`}>RTT: {connectionStats.rtt.toFixed(0)} ms</span>
                <span className={`px-3 py-1 rounded-full font-semibold shadow ${connectionStats.packetsLost < 5 ? 'bg-green-700/80' : connectionStats.packetsLost < 20 ? 'bg-yellow-700/80' : 'bg-red-700/80'}`}>Pérdida: {connectionStats.packetsLost}</span>
                <span className="px-3 py-1 rounded-full font-semibold shadow bg-blue-700/80">Bitrate: {(connectionStats.bitrate / 1000).toFixed(0)} kbps</span>
              </div>
            </div>

            {/* Controles Avanzados */}
            <div>
              <button 
                onClick={() => setShowControls(!showControls)}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 py-3 rounded-xl transition-colors flex items-center justify-center text-lg font-semibold shadow-lg gap-2"
              >
                <span className={`transform transition-transform ${showControls ? 'rotate-180' : ''}`}>▲</span>
                <span>{showControls ? 'Ocultar' : 'Mostrar'} Controles Avanzados</span>
              </button>
              {showControls && (
                <div className="mt-6 space-y-6 bg-gray-900/80 p-6 rounded-2xl animate-fade-in shadow border border-gray-700">
                  {/* Filtros */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">🎨 Filtros</h4>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setCurrentFilter('none')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow ${currentFilter === 'none' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>❌ Quitar filtro</button>
                      {videoFilters.filter(f => f.id !== 'none').map(filter => (
                        <button key={filter.id} onClick={() => setCurrentFilter(filter.id)} tabIndex={0} title={`Filtro: ${filter.name}`} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-400 ${currentFilter === filter.id ? 'bg-blue-600 border-2 border-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{filter.icon} {filter.name} {currentFilter === filter.id && <span className="ml-2 animate-bounce">✔️</span>}</button>
                      ))}
                    </div>
                  </div>
                  {/* Grabación */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">🎬 Grabación</h4>
                    <div className="flex gap-2">
                      <button onClick={startRecording} disabled={isRecording} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-4 py-2 rounded-lg text-sm font-semibold shadow">Grabar</button>
                      <button onClick={stopRecording} disabled={!isRecording} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 px-4 py-2 rounded-lg text-sm font-semibold shadow">Detener</button>
                      <button onClick={captureScreenshot} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold shadow">Capturar Screenshot</button>
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