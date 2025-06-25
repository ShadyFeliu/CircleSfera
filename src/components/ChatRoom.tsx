/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import ScreenRecorder from "./ScreenRecorder";
import { useUserStats } from "@/hooks/useUserStats";
import { useTheme } from "./ThemeProvider";
import { ThemeSettings } from "./ThemeSettings";
import { AdvancedPreferences } from "./AdvancedPreferences";
import { SocialSharing } from "./SocialSharing";
import Image from "next/image";
import VideoEffectsBar from "./VideoEffectsBar";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC, WebRTCStatus } from "@/hooks/useWebRTC";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import PartnerProfile, { PartnerProfileData } from "./PartnerProfile";

const EnhancedWebRTC = dynamic(() => import("./EnhancedWebRTC"));
const UserDashboard = dynamic(() => import("./UserDashboard"));

type Message = {
  author: "me" | "partner";
  text: string;
  timestamp: Date;
  type: "text" | "image";
  imageUrl?: string;
};

type DataType = 
  | { type: "chat"; text: string; messageType: "text" | "image"; imageUrl?: string }
  | { type: "typing"; value: boolean }
  | { type: "muted"; value: boolean }
  | { type: "video_off"; value: boolean };

type ConnectionStatus = 
  | "connecting"
  | "waiting"
  | "connected"
  | "disconnected"
  | "error"
  | "banned";

type ConnectionError = {
  message: string;
  code?: string;
  reconnectable?: boolean;
};

type UserPreferences = {
  language: string[];
  country: string[];
  ageRange: {
    min: number;
    max: number;
  };
  interests: string[];
  gender: 'any' | 'male' | 'female' | 'other';
  connectionType: 'video' | 'audio' | 'both';
  timezone: string;
  notificationSettings: {
    newMatches: boolean;
    connectionQuality: boolean;
    achievements: boolean;
  };
};

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
      'stun:global.stun.twilio.com:3478'
    ] },
    // TURN públicos
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:relay.metered.ca:80',
        'turn:relay.metered.ca:443',
        'turns:relay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    // Puedes añadir más TURN aquí si tienes credenciales propias
  ],
  iceCandidatePoolSize: 10,
};

// Connection timeout constants
const CONNECTION_TIMEOUT = 60000; // 60 segundos (aumentado de 30)
const SIGNALING_TIMEOUT = 45000; // 45 segundos (aumentado de 20)

// Utilidad profesional para obtener o generar un UUID v4 persistente por dispositivo (compatible universalmente)
function generateUUIDv4() {
  // https://stackoverflow.com/a/2117523/2715716
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('circlesfera_device_id');
  if (!deviceId) {
    deviceId = generateUUIDv4();
    localStorage.setItem('circlesfera_device_id', deviceId);
  }
  return deviceId;
}

const ChatRoom = ({ interests, ageFilter }: { interests: string; ageFilter?: string }) => {
  console.log('🎬 ChatRoom component iniciando...');
  console.log('🔍 Props recibidas - interests:', interests, 'ageFilter:', ageFilter);
  
  // Memoizar el deviceId para evitar regeneraciones innecesarias
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  
  // --- HOOKS AL INICIO ---
  // Estados principales
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Buscando un compañero...");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 2;

  // Estadísticas de usuario
  const {
    incrementChats,
    addChatTime,
    addInterest,
    addCountry
  } = useUserStats();

  // Tema
  const { toggleTheme, colorScheme } = useTheme();

  // Preferencias y UI
  const [myFilter, setMyFilter] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPartnerMuted, setIsPartnerMuted] = useState(false);
  const [isPartnerVideoOff, setIsPartnerVideoOff] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showScreenRecorder, setShowScreenRecorder] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("good");
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSocialSharing, setShowSocialSharing] = useState(false);
  const [useEnhancedWebRTC, setUseEnhancedWebRTC] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [currentEffect, setCurrentEffect] = useState<string>('none');
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfileData | null>(null);

  // Refs
  const myVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const myStreamRef = useRef<MediaStream>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const markIntentionalDisconnectRef = useRef<(() => void) | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const signalBufferRef = useRef<Peer.SignalData[]>([]);

  // WebRTC y socket
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [partnerSignal, setPartnerSignal] = useState<Peer.SignalData | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [webRTCReady, setWebRTCReady] = useState(false);
  const [webRTCError, setWebRTCError] = useState<Error | null>(null);
  const [webRTCStatus, setWebRTCStatus] = useState<WebRTCStatus>('idle');
  const [webRTCMetrics, setWebRTCMetrics] = useState({ rtt: 0, packetsLost: 0, bitrate: 0 });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Socket personalizado
  const { socket, status: socketStatus, retries } = useSocket();
  const socketRef = useRef<typeof socket | null>(null);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // useWebRTC SIEMPRE después de los useState necesarios
  const {
    status: rtcStatus,
    error: rtcError,
    remoteStream: rtcRemoteStream,
    metrics: rtcMetrics,
    createPeer,
    signal: sendSignal,
    destroy: destroyPeer,
    peer,
  } = useWebRTC({
    initiator: isInitiator,
    stream: localStream,
    iceServers: ICE_SERVERS.iceServers,
    onSignal: (data) => {
      if (socketRef.current) {
        socketRef.current.emit('signal', data);
      }
    },
    onError: (err) => setWebRTCError(err),
    onQualityChange: (quality) => setConnectionQuality(quality),
  });

  // Sincronizo los estados del hook con los locales para mantener la UI:
  useEffect(() => { setRemoteStream(rtcRemoteStream); }, [rtcRemoteStream]);
  useEffect(() => { setWebRTCMetrics(rtcMetrics); }, [rtcMetrics]);
  useEffect(() => { setWebRTCStatus(rtcStatus); }, [rtcStatus]);
  useEffect(() => { setWebRTCError(rtcError); }, [rtcError]);

  // Emojis disponibles
  const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "😎", "🤣", "😭", "😱", "😴", "🤗", "😇"];

  // Emojis de reacción rápida
  const quickReactions = ["🎉", "😂", "👍", "❤️", "🔥", "👏", "😮", "😎", "🥳", "🤩"];

  // Animación CSS para reacciones
  const reactionAnimation = "animate-reaction-pop absolute left-1/2 top-1/3 text-5xl pointer-events-none select-none z-[90]";

  // Cargar preferencias del usuario
  useEffect(() => {
    const savedPreferences = localStorage.getItem('circlesfera_preferences');
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const startNewChat = useCallback(() => {
    console.log('🚀 startNewChat ejecutándose...');
    console.log('🔍 Socket connected:', socketRef.current?.connected);
    console.log('🔍 Socket ID:', socketRef.current?.id);
    
    if (socketRef.current?.connected) {
      console.log('✅ Socket conectado, enviando find_partner...');
      console.log('Buscando nuevo compañero con intereses:', interests);
      console.log('DeviceId que se enviará:', deviceId);
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      console.log('🔍 Intereses procesados:', interestsArray);
      socketRef.current.emit('find_partner', { interests: interestsArray, ageFilter, deviceId });
      console.log('✅ Evento find_partner enviado');
      setConnectionStatus("waiting");
      setStatus("Buscando un compañero...");
    } else {
      console.error("❌ No se puede iniciar un nuevo chat, el socket no está conectado.");
      console.error("🔍 Socket status:", socketRef.current?.connected);
      console.error("🔍 Socket ID:", socketRef.current?.id);
    }
  }, [interests, ageFilter, deviceId]);

  const handleNextChat = useCallback(() => {
    setReconnectAttempts(0);
    setMessages([]);
    setStatus("Buscando un compañero...");
    setConnectionStatus("waiting");
    setIsPartnerMuted(false);
    setIsPartnerVideoOff(false);
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
    setRemoteStream(null);
    // Buscar nuevo compañero
    if (socketRef.current?.connected) {
      console.log('Buscando nuevo compañero (handleNextChat) con deviceId:', deviceId);
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      socketRef.current.emit('find_partner', { interests: interestsArray, ageFilter, deviceId });
    } else {
      console.error("Socket no conectado. No se puede buscar nuevo compañero.");
    }
  }, [interests, ageFilter, deviceId]);

  // Reconnection logic
  useEffect(() => {
    if (connectionStatus === "error" && connectionError?.reconnectable && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const timer = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        setReconnectAttempts(prev => prev + 1);
        socketRef.current?.disconnect();
        const newSocket = io(process.env.NODE_ENV === 'production' 
          ? 'https://api.circlesfera.com' 
          : (process.env.NEXT_PUBLIC_SOCKET_URL || `http://${window.location.hostname}:3001`));
        socketRef.current = newSocket;
      }, 5000 * (reconnectAttempts + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, connectionError, reconnectAttempts]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('🔄 useEffect principal ejecutándose...');
    console.log('🔍 Socket disponible:', !!socket);
    console.log('🔍 Socket connected:', socket?.connected);
    
    // Si el socket no está disponible o no está conectado, salir
    if (!socket || !socket.connected) {
      console.log('⏳ Socket no disponible o no conectado, esperando...');
      return;
    }
    
    let myStream: MediaStream | undefined;
    let isComponentMounted = true;

    // Conectar solo una vez
    if (!socketRef.current) {
      socketRef.current = socket;
    }

    const onConnect = () => {
      console.log('✅ Conectado al servidor! Buscando pareja con intereses:', interests);
      console.log('🔍 Socket status:', socketRef.current?.connected);
      console.log('🔍 Socket ID:', socketRef.current?.id);
      startNewChat();
      // Solicitar contador inicial
      socketRef.current?.emit('get_user_count');
    };

    // Si el socket ya está conectado, ejecutar startNewChat inmediatamente
    if (socket.connected) {
      console.log('✅ Socket ya conectado, ejecutando startNewChat inmediatamente');
      startNewChat();
      socket.emit('get_user_count');
    }

    const onUserCount = (count: number) => {
      if (isComponentMounted) {
      setOnlineUsers(count);
        console.log('[Users] Contador actualizado:', count);
        
        // Mostrar información especial cuando hay exactamente 2 personas
        if (count === 2 && connectionStatus === "waiting") {
          setStatus("¡Hay otra persona conectada! Emparejando automáticamente...");
        } else if (count === 1 && connectionStatus === "waiting") {
          setStatus("Esperando a que se conecte otra persona...");
        } else if (count > 2 && connectionStatus === "waiting") {
          setStatus("Buscando un compañero...");
        }
      }
    };

    // Función para actualizar contador periódicamente
    const updateUserCount = () => {
      if (socket?.connected && isComponentMounted) {
        socket?.emit('get_user_count');
      }
    };

    // Actualizar contador cada 10 segundos
    const userCountInterval = setInterval(updateUserCount, 10000);

    socket?.on('connect', onConnect);
    socket?.on('user_count', onUserCount);

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Error: La cámara no es accesible en este navegador o la página no es segura (se requiere HTTPS).");
      socket?.off('connect', onConnect);
      socket?.off('user_count', onUserCount);
      socket?.off("partner");
      socket?.off("signal");
      socket?.off("partner_disconnected");
      socket?.off("partner_muted");
      socket?.off("partner_video_off");
      
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      if (markIntentionalDisconnectRef.current) {
        markIntentionalDisconnectRef.current();
      }
      clearInterval(userCountInterval);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('[Camera] Stream obtenido exitosamente:', stream.getTracks().map(t => t.kind));
        myStream = stream;
        myStreamRef.current = stream;
        
        // Asignar stream solo una vez al video
        if (myVideo.current && !myVideo.current.srcObject) {
          myVideo.current.srcObject = stream;
          console.log('[Camera] Stream asignado al video personal');
        }

        const setupPeer = (partnerID: string, initiator: boolean) => {
          console.log('[WebRTC] Creando peer. initiator:', initiator, 'partnerID:', partnerID);
          // Limpiar peer anterior completamente
          if (markIntentionalDisconnectRef.current) {
            markIntentionalDisconnectRef.current();
          }
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
          
          // Limpiar buffer de señales
          signalBufferRef.current = [];

          // Limpiar video del compañero
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = null;
          }

          let signalingTimeout: NodeJS.Timeout | undefined;
          
          const peer = new Peer({
            initiator,
            trickle: true,
            stream: stream,
            config: ICE_SERVERS,
            channelConfig: {
              ordered: false,
              maxRetransmits: 3
            }
          });

          // Timeout de señalización a 45 segundos
          signalingTimeout = setTimeout(() => {
            console.log('[WebRTC] ⚠️ Signaling timeout (45s). Destruyendo peer.');
            peer.destroy();
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
                console.log('[WebRTC] Reintentando conexión, intento', reconnectAttempts + 1);
                // Llama a handleNextChat o startNewChat según tu lógica
                handleNextChat();
              }, 1500);
            } else {
              setStatus('No se pudo establecer la conexión. Intenta de nuevo más tarde.');
              setReconnectAttempts(0);
            }
          }, 45000);

          peer.on('connect', () => {
            console.log('[WebRTC] Peer conectado');
            console.log('[WebRTC] Peer connected:', peer.connected);
            console.log('[WebRTC] Peer destroyed:', peer.destroyed);
            console.log('[WebRTC] Stream local:', !!peer.streams[0]);
            console.log('[WebRTC] Stream local tracks:', peer.streams[0]?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
            
            clearTimeout(signalingTimeout);
            setStatus("Conectado");
            setConnectionStatus("connected");
            setMessages([]);
            incrementChats();
            
            if (interests) {
              interests.split(',').forEach(interest => {
                if (interest.trim()) addInterest(interest.trim().toLowerCase());
              });
            }
            
            const markIntentionalDisconnect = monitorConnectionQuality(peer);
            markIntentionalDisconnectRef.current = markIntentionalDisconnect;

            // Procesar señales en buffer
            if (signalBufferRef.current.length > 0) {
              console.log('[WebRTC] Procesando', signalBufferRef.current.length, 'señales en buffer tras crear peer');
              signalBufferRef.current.forEach(signal => {
                try {
                  peer.signal(signal);
                  console.log('[WebRTC] Señal procesada del buffer');
                } catch (e) {
                  console.error('[WebRTC] Error procesando señal del buffer:', e);
                }
              });
              signalBufferRef.current = [];
            }
          });

          peer.on('signal', (signal: Peer.SignalData) => {
            if (socket && isComponentMounted) {
              socket.emit('signal', { to: partnerID, signal });
            }
          });

          peer.on('stream', (partnerStream) => {
            console.log('[WebRTC] Stream de compañero recibido:', partnerStream);
            console.log('[WebRTC] Stream tracks:', partnerStream.getTracks());
            console.log('[WebRTC] partnerVideo.current existe:', !!partnerVideo.current);
            console.log('[WebRTC] useEnhancedWebRTC:', useEnhancedWebRTC);
            
            if (isComponentMounted) {
              setRemoteStream(partnerStream);
              console.log('[WebRTC] remoteStream actualizado en estado');
              
              if (partnerVideo.current && !useEnhancedWebRTC) {
                console.log('[WebRTC] Asignando stream al video del compañero');
                partnerVideo.current.srcObject = partnerStream;
                console.log('[WebRTC] Stream asignado al video del compañero');
              }
            }
          });

          peer.on('iceStateChange', (state) => {
            console.log('[WebRTC] ICE state change:', state);
          });

          peer.on('iceCandidate', (candidate) => {
            console.log('[WebRTC] ICE candidate:', candidate);
          });

          peer.on('close', () => {
            console.log('[WebRTC] Peer cerrado');
            console.log('[WebRTC] Peer connected al cerrar:', peer.connected);
            console.log('[WebRTC] Peer destroyed al cerrar:', peer.destroyed);
            console.log('[WebRTC] Streams al cerrar:', peer.streams.length);
            
            clearTimeout(signalingTimeout);
            if (markIntentionalDisconnectRef.current) {
              markIntentionalDisconnectRef.current();
            }
            setStatus("Tu compañero se ha desconectado.");
            setConnectionStatus("disconnected");
            setConnectionQuality("good");
            if (partnerVideo.current) {
              partnerVideo.current.srcObject = null;
            }
            setRemoteStream(null);
            addCountry(["España", "México", "Argentina", "Colombia", "Chile", "Estados Unidos"][Math.floor(Math.random() * 6)]);
          });

          peer.on('error', (err) => {
            console.error('[WebRTC] Error en Peer:', err);
            clearTimeout(signalingTimeout);
            if (err.message && (
              err.message.includes('ICE') || 
              err.message.includes('connection') ||
              err.message.includes('network')
            )) {
              handlePeerError(err);
            } else {
              console.warn('[WebRTC] Error menor en peer:', err.message);
              setConnectionQuality("good");
            }
          });

          peer.on('data', (data) => {
            console.log('[WebRTC] Data recibida:', data);
            if (!isComponentMounted) return;
            try {
              const parsed: DataType = JSON.parse(data.toString());
              if (parsed.type === "chat") {
                const message: Message = { 
                  author: "partner", 
                  text: parsed.text,
                  timestamp: new Date(),
                  type: parsed.messageType || "text",
                  imageUrl: parsed.imageUrl
                };
                setMessages((prev) => [...prev, message]);
                setIsPartnerTyping(false);
                playNotificationSound();
              } else if (parsed.type === "typing") {
                setIsPartnerTyping(parsed.value);
              } else if (parsed.type === "muted") {
                setIsPartnerMuted(parsed.value);
              } else if (parsed.type === "video_off") {
                setIsPartnerVideoOff(parsed.value);
              }
            } catch (e) {
              console.error("Dato recibido no es JSON válido:", e);
            }
          });
        };

        socket?.on("partner", (data: { id: string; initiator: boolean; profile?: unknown }) => { 
          if (isComponentMounted) {
            console.log('[WebRTC] Evento partner recibido. ID del compañero:', data.id, 'initiator:', data.initiator);
            setupPeer(data.id, data.initiator);
            if (data.profile) {
              setPartnerProfile(data.profile);
            }
          }
        });
        
        socket?.on("signal", (data: { from: string; signal: Peer.SignalData; }) => { 
          console.log('[WebRTC] Señal recibida del socket:', data);
          console.log('[WebRTC] Tipo de señal recibida:', data.signal.type);
          console.log('[WebRTC] Peer existe:', !!peerRef.current);
          console.log('[WebRTC] Peer connected:', peerRef.current?.connected);
          console.log('[WebRTC] Peer destroyed:', peerRef.current?.destroyed);
          
          if (peerRef.current && isComponentMounted) {
            console.log('[WebRTC] Procesando señal en peer');
            peerRef.current.signal(data.signal); 
            console.log('[WebRTC] Señal procesada en peer');
          } else {
            console.log('[WebRTC] Peer no disponible, guardando señal en buffer');
            signalBufferRef.current.push(data.signal);
            console.log('[WebRTC] Señales en buffer:', signalBufferRef.current.length);
          }
        });

        socket?.on("partner_disconnected", () => {
          if (!isComponentMounted) return;
          
            setStatus("Tu compañero se ha desconectado. Buscando uno nuevo...");
          if(peerRef.current) {
            peerRef.current.destroy();
          }
          const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
          socketRef.current?.emit('find_partner', { interests: interestsArray, ageFilter, deviceId });
        });

        socket?.on("partner_muted", (muted: boolean) => {
          if (isComponentMounted) {
          setIsPartnerMuted(muted);
          }
        });

        socket?.on("partner_video_off", (videoOff: boolean) => {
          if (isComponentMounted) {
          setIsPartnerVideoOff(videoOff);
          }
        });
      })
      .catch(error => {
        console.error('[Camera] Error al obtener stream:', error);
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setStatus("Error: Permisos denegados. Por favor, permite acceso a cámara y micrófono en la configuración del navegador.");
          } else if (error.name === 'NotFoundError') {
            setStatus("Error: No se encontró cámara o micrófono. Verifica que los dispositivos estén conectados.");
          } else if (error.name === 'NotReadableError') {
            setStatus("Error: La cámara o micrófono están siendo usados por otra aplicación.");
          } else if (error.name === 'OverconstrainedError') {
            setStatus("Error: La cámara no cumple con los requisitos mínimos.");
          } else {
            setStatus(`Error al acceder a la cámara: ${error.message}`);
          }
        } else {
          setStatus("Error desconocido al solicitar permisos de cámara");
        }
        
        setConnectionStatus("error");
      });

    return () => {
      isComponentMounted = false;
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      if (markIntentionalDisconnectRef.current) {
        markIntentionalDisconnectRef.current();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      clearInterval(userCountInterval);
    };
  }, [socket, socket?.connected, interests, ageFilter, deviceId]);
  
  // Efecto para manejar la restauración del stream del compañero cuando se cierra el WebRTC Avanzado
  useEffect(() => {
    if (!useEnhancedWebRTC && remoteStream && partnerVideo.current) {
      partnerVideo.current.srcObject = remoteStream;
    }
  }, [useEnhancedWebRTC, remoteStream]);

  // Efecto para verificar que el elemento de video del compañero existe
  useEffect(() => {
    console.log('[Video] partnerVideo.current existe:', !!partnerVideo.current);
    console.log('[Video] remoteStream existe:', !!remoteStream);
    console.log('[Video] useEnhancedWebRTC:', useEnhancedWebRTC);
  }, [partnerVideo.current, remoteStream, useEnhancedWebRTC]);
  
  const monitorConnectionQuality = (peer: Peer.Instance) => {
    let isIntentionalDisconnect = false;
    
    // Función para marcar desconexión intencional
    const markIntentionalDisconnect = () => {
      isIntentionalDisconnect = true;
    };
    
    // Verificar calidad inicial
    if (peer.connected) {
      setConnectionQuality("good");
    } else {
      setConnectionQuality("good");
    }

    // Configurar intervalos para monitorear la calidad solo si está conectado
    const interval = setInterval(() => {
      if (peer.connected) {
        setConnectionQuality("good");
      } else if (!peer.destroyed) {
        setConnectionQuality("good");
      }
      // No cambiamos a "poor" automáticamente para evitar falsos positivos
    }, 10000); // Aumentar intervalo a 10 segundos

    // Limpiar intervalo cuando el peer se destruya
    peer.on('close', () => {
      clearInterval(interval);
      // Solo marcar como mala si no fue intencional
      if (!isIntentionalDisconnect) {
        // Para desconexiones normales, mantener neutral en lugar de mala
        setConnectionQuality("good");
              }
            });
            
    peer.on('connect', () => {
      setConnectionQuality("good");
    });

    peer.on('error', (err) => {
      console.warn('[WebRTC] Error en peer (puede ser normal):', err);
      // Solo marcar como mala si es un error crítico de ICE
      if (err.message && (
        err.message.includes('ICE') || 
        err.message.includes('connection') ||
        err.message.includes('network')
      )) {
              setConnectionQuality("poor");
            } else {
        // Para errores menores, mantener neutral
              setConnectionQuality("good");
            }
    });
    
    // Retornar función para marcar desconexión intencional
    return markIntentionalDisconnect;
  };
  
  // Handle WebRTC peer errors
  const handlePeerError = (error: Error) => {
    console.error('Peer error:', error);
    setConnectionError({
      message: 'Error en la conexión de video. Intentando reconectar...', 
      reconnectable: true 
    });
    setConnectionStatus("error");
  };

  // Enviar datos por el canal de datos del peer del hook
  const sendData = (data: DataType) => {
    if (peerRef.current && peerRef.current.connected) {
      peerRef.current.send(JSON.stringify(data));
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch {
      // Ignore audio errors
    }
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;
    
    if (message.trim()) {
      const newMessage: Message = {
        author: "me", 
        text: message,
        timestamp: new Date(),
        type: "text"
      };
      
      setMessages(prev => [...prev, newMessage]);
      sendData({ type: "chat", text: message, messageType: "text" });
      e.currentTarget.reset();
    }
  };

  const handleSendEmoji = (emoji: string) => {
    const newMessage: Message = {
      author: "me", 
      text: emoji,
      timestamp: new Date(),
      type: "text"
    };
    
    setMessages(prev => [...prev, newMessage]);
    sendData({ type: "chat", text: emoji, messageType: "text" });
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const imageUrl = event.target?.result as string;
        const newMessage: Message = {
          author: "me", 
          text: "Imagen enviada",
          timestamp: new Date(),
          type: "image",
          imageUrl
        };
        
        setMessages(prev => [...prev, newMessage]);
        sendData({ type: "chat", text: "Imagen enviada", messageType: "image", imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTyping = () => {
    sendData({ type: "typing", value: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendData({ type: "typing", value: false });
    }, 2000);
  };
  
  // Error message component
  const ConnectionErrorMessage = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="bg-red-600 p-4 rounded-lg text-white max-w-md text-center">
        <h3 className="text-xl font-bold mb-2">Error de Conexión</h3>
        <p>{connectionError?.message}</p>
        {connectionError?.reconnectable && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && (
          <p className="mt-2">
            Reintentando conexión... ({reconnectAttempts + 1}/{MAX_RECONNECT_ATTEMPTS})
          </p>
        )}
        {(!connectionError?.reconnectable || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-red-600 px-4 py-2 rounded hover:bg-red-100"
          >
            Reiniciar Aplicación
          </button>
        )}
      </div>
    </div>
  );

  const toggleMute = () => {
    if (myStreamRef.current) {
      const audioTrack = myStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        sendData({ type: "muted", value: !audioTrack.enabled });
        socketRef.current?.emit('toggle_mute', !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      const videoTrack = myStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        sendData({ type: "video_off", value: !videoTrack.enabled });
        socketRef.current?.emit('toggle_video', !videoTrack.enabled);
      }
    }
  };

  const reportUser = (reason: string) => {
    // Enviar reporte al servidor - el servidor manejará la identificación del compañero
    socketRef.current?.emit('report_user', { reason });
    setShowReportModal(false);
    handleNextChat();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const requestCameraPermissions = async () => {
    try {
      console.log('[Camera] Solicitando permisos manualmente...');
      
      // Primero verificar si los dispositivos están disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('[Camera] Dispositivos disponibles:', {
        video: videoDevices.length,
        audio: audioDevices.length
      });
      
      if (videoDevices.length === 0) {
        setStatus("Error: No se encontró ninguna cámara conectada");
        return;
      }
      
      // Solicitar permisos de video primero
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      console.log('[Camera] Permisos de video concedidos');
      
      // Luego solicitar permisos de audio
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true 
      });
      
      console.log('[Camera] Permisos de audio concedidos');
      
      // Combinar los streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      if (myVideo.current) {
        myVideo.current.srcObject = combinedStream;
        myStreamRef.current = combinedStream;
        console.log('[Camera] Stream combinado asignado:', combinedStream.getTracks().map(t => t.kind));
        setStatus("Cámara y micrófono conectados exitosamente");
        setConnectionStatus("waiting");
      }
      
      // Limpiar streams individuales
      videoStream.getTracks().forEach(track => track.stop());
      audioStream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('[Camera] Error al solicitar permisos:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setStatus("Error: Permisos denegados. Por favor, permite acceso a cámara y micrófono en la configuración del navegador.");
        } else if (error.name === 'NotFoundError') {
          setStatus("Error: No se encontró cámara o micrófono. Verifica que los dispositivos estén conectados.");
        } else {
          setStatus(`Error al solicitar permisos: ${error.message}`);
        }
      } else {
        setStatus("Error desconocido al solicitar permisos de cámara");
      }
    }
  };

  const forceCameraOnly = async () => {
    try {
      console.log('[Camera] Forzando solo cámara...');
      
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      if (myVideo.current) {
        myVideo.current.srcObject = videoStream;
        myStreamRef.current = videoStream;
        console.log('[Camera] Solo cámara activada');
        setStatus("Cámara activada (sin micrófono)");
        setConnectionStatus("waiting");
      }
      
    } catch (error) {
      console.error('[Camera] Error al forzar cámara:', error);
      setStatus("Error al activar solo la cámara");
    }
  };

  // Enviar efecto al compañero por WebRTC
  useEffect(() => {
    if (peerRef.current && peerRef.current.connected) {
      peerRef.current.send(JSON.stringify({ type: 'effect', effect: currentEffect }));
    }
    // Aplica el efecto al vídeo local
    if (myVideo.current) {
      if (currentEffect === 'none') {
        myVideo.current.style.filter = 'none';
      } else if (currentEffect === 'blur') {
        myVideo.current.style.filter = 'blur(5px)';
      } else if (currentEffect === 'grayscale') {
        myVideo.current.style.filter = 'grayscale(100%)';
      } else if (currentEffect === 'sepia') {
        myVideo.current.style.filter = 'sepia(100%)';
      } else if (currentEffect === 'invert') {
        myVideo.current.style.filter = 'invert(100%)';
      }
    }
  }, [currentEffect, peerRef.current]);

  // Aplica el efecto recibido al vídeo del compañero
  useEffect(() => {
    if (!peerRef.current) return;
    const onData = (data: unknown) => {
      try {
        const parsed = JSON.parse(data as string);
        if (parsed.type === 'effect' && partnerVideo.current) {
          if (parsed.effect === 'none') {
            partnerVideo.current.style.filter = 'none';
          } else if (parsed.effect === 'blur') {
            partnerVideo.current.style.filter = 'blur(5px)';
          } else if (parsed.effect === 'grayscale') {
            partnerVideo.current.style.filter = 'grayscale(100%)';
          } else if (parsed.effect === 'sepia') {
            partnerVideo.current.style.filter = 'sepia(100%)';
          } else if (parsed.effect === 'invert') {
            partnerVideo.current.style.filter = 'invert(100%)';
          }
        }
      } catch {}
    };
    peerRef.current.on('data', onData);
    return () => {
      if (peerRef.current) {
        peerRef.current.off('data', onData);
      }
    };
  }, [peerRef.current]);

  // Feedback visual de calidad y métricas WebRTC
  const renderWebRTCQuality = () => {
    let color = 'bg-gray-500';
    let text = 'Desconocida';
    if (webRTCStatus === 'connected') {
      if (webRTCMetrics.rtt < 100 && webRTCMetrics.packetsLost < 5) {
        color = 'bg-green-600'; text = 'Excelente';
      } else if (webRTCMetrics.rtt > 300 || webRTCMetrics.packetsLost > 20) {
        color = 'bg-red-600'; text = 'Mala';
      } else {
        color = 'bg-yellow-500'; text = 'Buena';
      }
    } else if (webRTCStatus === 'connecting') {
      color = 'bg-yellow-500'; text = 'Conectando...';
    } else if (webRTCStatus === 'error') {
      color = 'bg-red-600'; text = 'Error';
    }
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow ${color} transition-all duration-200 hover:scale-105 active:scale-95`}>
        <span className="mr-2">🔗</span>{text}
      </div>
    );
  };

  const renderWebRTCMetrics = () => (
    <div className="flex flex-col gap-1 text-xs text-gray-200 bg-gray-900/80 rounded-lg px-3 py-2 mt-2 shadow-lg border border-gray-700 w-fit transition-all duration-200 hover:scale-105 active:scale-95">
      <div>RTT: <span className="font-mono">{Math.round(webRTCMetrics.rtt)} ms</span></div>
      <div>Pérdida: <span className="font-mono">{webRTCMetrics.packetsLost}</span></div>
      <div>Bitrate: <span className="font-mono">{(webRTCMetrics.bitrate/1000).toFixed(0)} kbps</span></div>
    </div>
  );

  // Botón de volver solo móvil
  const renderBackButton = () => (
    <button
      onClick={() => window.history.back()}
      className="fixed top-4 left-4 z-[100] md:hidden bg-black/70 text-white px-4 py-2 rounded-full shadow-lg border border-gray-700 backdrop-blur-sm text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label="Volver"
    >
      ⬅ Volver
    </button>
  );

  // Animación de entrada para mensajes
  const messageAnimation = "animate-fade-in-up transition-all duration-300";

  // Enviar reacción al compañero
  const sendReaction = (emoji: string) => {
    if (peerRef.current && peerRef.current.connected) {
      peerRef.current.send(JSON.stringify({ type: 'reaction', emoji }));
    } else if (socketRef.current?.connected) {
      socketRef.current.emit('reaction', { emoji });
    }
    setIncomingReaction(emoji);
    setReactionKey(prev => prev + 1);
    setTimeout(() => setIncomingReaction(null), 1200);
  };

  // Recibir reacción por WebRTC
  useEffect(() => {
    if (!peerRef.current) return;
    const onData = (data: unknown) => {
      try {
        const parsed = JSON.parse(data as string);
        if (parsed.type === 'reaction') {
          setIncomingReaction(parsed.emoji);
          setReactionKey(prev => prev + 1);
        }
      } catch {}
    };
    peerRef.current.on('data', onData);
    return () => { 
      if (peerRef.current) {
        peerRef.current.off('data', onData); 
      }
    };
  }, [peerRef.current]);

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white">
      {renderBackButton()}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 md:gap-8 p-2 sm:p-4 md:p-8 bg-gray-900 mx-auto">
        <div className="flex-1 flex flex-col gap-4">
          <div className="w-full h-[60vh] lg:h-[70vh] bg-gradient-to-br from-black to-gray-900 rounded-2xl overflow-hidden relative video-container shadow-2xl border border-gray-700">
            <video 
              ref={partnerVideo} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover relative z-0" 
            />
            {/* Perfil del compañero */}
            {partnerProfile && (
              <div className="absolute top-4 right-4 z-20">
                <PartnerProfile profile={partnerProfile} />
              </div>
            )}
            <video 
              ref={myVideo} 
              autoPlay 
              muted 
              playsInline
              className={`w-32 h-32 lg:w-48 lg:h-48 absolute right-4 lg:right-6 bottom-4 lg:bottom-6 rounded-xl object-cover ring-4 ring-gray-700 transition-all duration-300 shadow-lg z-50 ${myFilter} transform-gpu`} 
            />
            
            <div className="absolute top-4 lg:top-6 left-4 lg:left-6 bg-black bg-opacity-70 backdrop-blur-sm text-white p-3 lg:p-4 rounded-xl animate-fade-in z-10 text-sm lg:text-base font-medium border border-gray-600">
              {status}
              {status.includes("Error") && status.includes("cámara") && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={requestCameraPermissions}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors"
                  >
                    Permitir Cámara + Mic
                  </button>
                  <button
                    onClick={forceCameraOnly}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs transition-colors"
                  >
                    Solo Cámara
                  </button>
                </div>
              )}
            </div>
            
            <div className="absolute top-4 lg:top-6 right-4 lg:right-6 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base animate-fade-in z-10 font-medium shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>{onlineUsers} online</span>
              </div>
            </div>

            <div className="absolute top-16 lg:top-20 right-4 lg:right-6 bg-black bg-opacity-70 backdrop-blur-sm text-white p-3 lg:p-4 rounded-xl connection-indicator z-10 border border-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connectionQuality === 'excellent' ? 'bg-green-500 animate-pulse' : connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm hidden sm:inline font-medium">
                  {connectionQuality === 'excellent' ? 'Excelente' : connectionQuality === 'good' ? 'Buena' : 'Mala'} conexión
                </span>
              </div>
            </div>

            <div className="absolute top-4 lg:top-6 left-1/2 transform -translate-x-1/2 flex space-x-2 lg:space-x-3 z-10">
              {isPartnerMuted && (
                <div className="bg-red-600 text-white px-3 py-2 rounded-xl animate-fade-in text-sm font-medium shadow-lg border border-red-500">
                  🔇 Silenciado
                </div>
              )}
              
              {isPartnerVideoOff && (
                <div className="bg-gray-600 text-white px-3 py-2 rounded-xl animate-fade-in text-sm font-medium shadow-lg border border-gray-500">
                  📹 Sin video
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center items-center gap-3 lg:gap-4 p-4 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl border border-gray-700">
            <div className="flex flex-wrap gap-2 lg:gap-3">
              <button onClick={() => setMyFilter('')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Normal</button>
              <button onClick={() => setMyFilter('grayscale')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">B&N</button>
              <button onClick={() => setMyFilter('sepia')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Sepia</button>
              <button onClick={() => setMyFilter('invert')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Invertir</button>
            </div>
            
            <button 
              onClick={toggleMute} 
              className={`font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg ${isMuted ? 'bg-red-600 hover:bg-red-700 border-red-500' : 'bg-green-600 hover:bg-green-700 border-green-500'} text-white border`}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            
            <button 
              onClick={toggleVideo} 
              aria-label="Activar/desactivar video"
              className={`font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg ${isVideoOff ? 'bg-red-600 hover:bg-red-700 border-red-500' : 'bg-green-600 hover:bg-green-700 border-green-500'} text-white border`}
            >
              {isVideoOff ? '📹' : '📷'}
            </button>

            <button onClick={handleNextChat} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-xl text-base lg:text-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-blue-500">
              Siguiente
            </button>

            <button 
              onClick={() => setShowThemeSettings(true)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-indigo-500"
              title="Personalizar tema"
            >
              🎨
            </button>

            <button 
              onClick={() => setShowDashboard(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-purple-500"
              title="Mi Dashboard"
            >
              📊
            </button>

            <button 
              onClick={() => setShowPreferences(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-orange-500"
              title="Preferencias"
            >
              ⚙️
            </button>

            <button 
              onClick={() => setShowSocialSharing(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-green-500"
              title="Compartir"
            >
              📤
            </button>

            <button 
              onClick={() => setUseEnhancedWebRTC(!useEnhancedWebRTC)}
              className={`font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg ${
                useEnhancedWebRTC ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 border-teal-500' : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border-gray-500'
              } text-white border`}
              title="WebRTC Avanzado"
            >
              ⚡
            </button>

            <button 
              onClick={() => setShowReportModal(true)} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-red-500"
            >
              Reportar
            </button>

            <button 
              onClick={() => setShowScreenRecorder(!showScreenRecorder)} 
              disabled={connectionStatus !== 'connected'}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎥
            </button>
          </div>

          {showScreenRecorder && (
            <div className="mt-6">
              <ScreenRecorder />
            </div>
          )}

          <VideoEffectsBar
            currentEffect={currentEffect}
            setCurrentEffect={setCurrentEffect}
            videoEffects={[
              { id: 'mirror', name: 'Espejo', icon: '🪞' },
              { id: 'zoom', name: 'Zoom', icon: '🔍' },
              { id: 'rotate', name: 'Rotar', icon: '🔄' },
            ]}
          />
        </div>

        <div className={`flex flex-col max-w-md w-full h-[60vh] md:h-[70vh] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 mx-auto relative`}>
          <h2 className="text-xl lg:text-2xl font-bold mb-2 mt-4 text-white text-center">Chat</h2>
          <div className="flex-1 overflow-y-auto mb-2 p-3 bg-gray-700 bg-opacity-50 rounded-xl custom-scrollbar border border-gray-600">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.author === "me" ? "text-right" : "text-left"} ${messageAnimation}`}>
                <div className={`inline-block p-3 lg:p-4 rounded-2xl max-w-[85%] lg:max-w-sm shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 ${
                  message.author === "me" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" 
                    : "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
                }`}>
                  {message.type === "image" && message.imageUrl && (
                    <Image
                      src={message.imageUrl}
                      alt="Imagen compartida"
                      width={300}
                      height={200}
                      className="rounded-lg mb-2 w-full"
                      loading="lazy"
                      sizes="(max-width: 600px) 100vw, 300px"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                  <p className="text-sm lg:text-base">{message.text}</p>
                  <p className="text-xs opacity-70 mt-2">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}
            {isPartnerTyping && (
              <div className="typing-indicator mt-2">
                <span className="text-sm lg:text-base text-gray-400 italic">El compañero está escribiendo</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>
          {/* Reacciones rápidas */}
          <div className="flex gap-2 justify-center flex-wrap mb-2 flex-shrink-0">
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-2xl md:text-3xl bg-white/10 hover:bg-white/30 rounded-full shadow-lg p-2 md:p-3 mx-1 transition-all duration-200 hover:scale-125 active:scale-95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`Enviar reacción ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {/* Input y botones */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pb-2 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 z-20 px-2">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-500"
            >
              😀
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              aria-label="Enviar imagen"
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-500"
            >
              📷
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            <input
              name="message"
              type="text"
              placeholder="Escribe un mensaje..."
              ref={messageInputRef}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg border border-blue-500">Enviar</button>
          </form>
          {/* Picker de emojis */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-700 bg-opacity-90 backdrop-blur-sm p-3 lg:p-4 rounded-xl mb-4 emoji-grid border border-gray-600 z-30">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleSendEmoji(emoji)}
                  className="emoji-button text-base lg:text-lg hover:scale-125 transition-transform duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {/* Overlay de reacción animada sobre el video del compañero */}
          {incomingReaction && (
            <span key={reactionKey} className={reactionAnimation} style={{ left: '50%', top: '35%' }}>
              {incomingReaction}
            </span>
          )}
        </div>

        {showReportModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
            <div className="bg-gray-800 p-4 lg:p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg lg:text-xl font-bold mb-4">Reportar Usuario</h3>
              <div className="space-y-2">
                {["Contenido inapropiado", "Comportamiento abusivo", "Spam", "Otro"].map((reason) => (
                <button 
                    key={reason}
                    onClick={() => reportUser(reason)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm lg:text-base transition-colors"
                >
                    {reason}
                </button>
                ))}
              </div>
                <button 
                onClick={() => setShowReportModal(false)}
                className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded text-sm lg:text-base transition-colors"
                >
                Cancelar
                </button>
            </div>
          </div>
        )}

        <ThemeSettings 
          isOpen={showThemeSettings} 
          onClose={() => setShowThemeSettings(false)} 
        />

        {showDashboard && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
            <Suspense fallback={<div className="flex justify-center items-center h-32"><span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span> <span className="ml-3 text-blue-500 font-semibold">Cargando dashboard...</span></div>}>
              <UserDashboard />
            </Suspense>
            <button 
              onClick={() => setShowDashboard(false)}
              className="fixed top-6 right-6 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full z-50 shadow-lg border border-gray-600 transition-all duration-200 hover:scale-110"
              title="Cerrar Dashboard"
            >
              ✕
            </button>
          </div>
        )}

        <AdvancedPreferences 
          isOpen={showPreferences} 
          onClose={() => setShowPreferences(false)}
          onSave={(preferences) => {
            setUserPreferences(preferences);
            console.log('Preferencias guardadas:', preferences);
          }}
        />

        <SocialSharing 
          isOpen={showSocialSharing} 
          onClose={() => setShowSocialSharing(false)}
          shareData={{
            title: 'CircleSfera - Conecta con el Mundo',
            description: '¡Acabo de tener una gran conversación en CircleSfera! Únete y conoce personas increíbles.',
            url: 'https://circlesfera.vercel.app',
            image: '/og-image.jpg'
          }}
        />

        {useEnhancedWebRTC && myStreamRef.current && (
          <div className="fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  WebRTC Avanzado
                </h2>
                <button 
                  onClick={() => setUseEnhancedWebRTC(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <EnhancedWebRTC
                  stream={myStreamRef.current}
                  partnerStream={rtcRemoteStream}
                  onStream={(stream) => {
                    console.log('Stream del compañero recibido en WebRTC Avanzado');
                  }}
                  onConnectionChange={(connected) => {
                    setConnectionStatus(connected ? 'connected' : 'disconnected');
                  }}
                  onQualityChange={(quality) => {
                    setConnectionQuality(quality);
                  }}
                  isInitiator={false}
                  signalData={null}
                  onSignal={() => {}}
                  onClose={() => setUseEnhancedWebRTC(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Feedback WebRTC calidad y métricas */}
        {webRTCStatus !== 'idle' && webRTCStatus !== 'disconnected' && (
          <div className="fixed top-2 left-2 flex flex-col items-start gap-2 z-40">
            {renderWebRTCQuality()}
            {renderWebRTCMetrics()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
