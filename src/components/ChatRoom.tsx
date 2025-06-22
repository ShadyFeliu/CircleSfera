/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import ScreenRecorder from "./ScreenRecorder";
import { useUserStats } from "@/hooks/useUserStats";
import { useTheme } from "./ThemeProvider";
import { ThemeSettings } from "./ThemeSettings";
import { UserDashboard } from "./UserDashboard";
import { AdvancedPreferences } from "./AdvancedPreferences";
import { SocialSharing } from "./SocialSharing";
import { EnhancedWebRTC } from "./EnhancedWebRTC";
import Image from "next/image";

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
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
    // Si quieres reintroducir TURN, descomenta y configura aquí
    // {
    //   urls: [
    //     'turn:relay.metered.ca:80',
    //     'turn:relay.metered.ca:443',
    //     'turns:relay.metered.ca:443?transport=tcp',
    //   ],
    //   username: 'openrelayproject',
    //   credential: 'openrelayproject',
    // },
  ],
  iceCandidatePoolSize: 10,
};

// Connection timeout constants
const CONNECTION_TIMEOUT = 30000; // 30 segundos
const SIGNALING_TIMEOUT = 20000; // 20 segundos

const ChatRoom = ({ interests, ageFilter }: { interests: string; ageFilter?: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Buscando un compañero...");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  
  // User statistics hook
  const {
    incrementChats,
    addChatTime,
    addInterest,
    addCountry
  } = useUserStats();

  // Theme hook
  const { toggleTheme, colorScheme } = useTheme();
  
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

  // Nuevas funcionalidades
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSocialSharing, setShowSocialSharing] = useState(false);
  const [useEnhancedWebRTC, setUseEnhancedWebRTC] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [partnerStreamRef, setPartnerStreamRef] = useState<MediaStream | null>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance>();
  const socketRef = useRef<Socket>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const myStreamRef = useRef<MediaStream>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const markIntentionalDisconnectRef = useRef<(() => void) | null>(null);

  // Emojis disponibles
  const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "😎", "🤣", "😭", "😱", "😴", "🤗", "😇"];

  // Cargar preferencias del usuario
  useEffect(() => {
    const savedPreferences = localStorage.getItem('circlesfera_preferences');
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Buscando nuevo compañero con intereses:', interests);
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      socketRef.current.emit('find_partner', { interests: interestsArray, ageFilter });
      setConnectionStatus("waiting");
      setStatus("Buscando un compañero...");
    } else {
      console.error("No se puede iniciar un nuevo chat, el socket no está conectado.");
      // Opcionalmente, intentar reconectar o mostrar un error al usuario.
    }
  }, [interests, ageFilter]);

  const handleNextChat = useCallback(() => {
    // Marcar desconexión intencional para evitar falsos positivos de mala conexión
    if (peerRef.current) {
      // Si tenemos la función de markIntentionalDisconnect, la llamamos
      if (markIntentionalDisconnectRef.current) {
        markIntentionalDisconnectRef.current();
      }
      peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
      peerRef.current.destroy();
      peerRef.current = undefined;
    }
    
    // Resetear calidad de conexión a neutral
    setConnectionQuality("good");
    
    setMessages([]);
    setStatus("Buscando un compañero...");
    setConnectionStatus("waiting");
    setIsPartnerMuted(false);
    setIsPartnerVideoOff(false);
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
    setPartnerStreamRef(null);
    // Buscar nuevo compañero
    if (socketRef.current?.connected) {
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      socketRef.current.emit('find_partner', { interests: interestsArray, ageFilter });
    } else {
      console.error("Socket no conectado. No se puede buscar nuevo compañero.");
    }
  }, [interests, ageFilter]);

  // Connection initialization function
  const initializeConnection = () => {
    setConnectionStatus("connecting");
    
    // URL dinámica para el servidor de señalización
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.circlesfera.com' 
      : (process.env.NEXT_PUBLIC_SOCKET_URL || `http://${window.location.hostname}:3001`);
    
    // Debug: Log the URL being used
    console.log('🔗 Socket URL:', socketUrl);
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    console.log('⚙️ NEXT_PUBLIC_SOCKET_URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
    
    const socket = io(socketUrl);
    socketRef.current = socket;
    
    // Setup socket event handlers
    socket.on('error', (error: { message: string; code?: string }) => {
      console.error('Socket error:', error);
      setConnectionError({ 
        message: error.message, 
        code: error.code, 
        reconnectable: error.code !== 'MAX_CONNECTIONS' 
      });
      setConnectionStatus("error");
    });
    
    socket.on('banned', (data: { message: string }) => {
      console.log('User banned:', data);
      setConnectionError({ 
        message: data.message, 
        reconnectable: false 
      });
      setConnectionStatus("banned");
    });
    
    return socket;
  };

  // Reconnection logic
  useEffect(() => {
    if (connectionStatus === "error" && connectionError?.reconnectable && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const timer = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        setReconnectAttempts(prev => prev + 1);
        socketRef.current?.disconnect();
        const newSocket = initializeConnection();
        socketRef.current = newSocket;
      }, 5000 * (reconnectAttempts + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, connectionError, reconnectAttempts]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const socket = initializeConnection();
    let myStream: MediaStream | undefined;
    let isComponentMounted = true;

    // Conectar solo una vez
    if (!socketRef.current) {
      socketRef.current = socket;
    }

    const onConnect = () => {
      console.log('Conectado al servidor! Buscando pareja con intereses:', interests);
      startNewChat();
      // Solicitar contador inicial
      socket.emit('get_user_count');
    };

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
      if (socket.connected && isComponentMounted) {
        socket.emit('get_user_count');
      }
    };

    // Actualizar contador cada 10 segundos
    const userCountInterval = setInterval(updateUserCount, 10000);

    socket.on('connect', onConnect);
    socket.on('user_count', onUserCount);

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Error: La cámara no es accesible en este navegador o la página no es segura (se requiere HTTPS).");
      socket.off('connect', onConnect);
      socket.off('user_count', onUserCount);
      socket.off("partner");
      socket.off("signal");
      socket.off("partner_disconnected");
      socket.off("partner_muted");
      socket.off("partner_video_off");
      
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      clearInterval(userCountInterval);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!isComponentMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('[Camera] Stream obtenido exitosamente:', stream.getTracks().map(t => t.kind));
        myStream = stream;
        myStreamRef.current = stream;
        
        // Asignar stream solo una vez al video
        if (myVideo.current && !myVideo.current.srcObject) {
          myVideo.current.srcObject = stream;
          console.log('[Camera] Stream asignado al video personal');
        }

        const setupPeer = (partnerID: string, initiator: boolean) => {
          // Limpiar peer anterior completamente
          if (peerRef.current) {
            peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
            peerRef.current.destroy();
            peerRef.current = undefined;
          }

          // Limpiar video del compañero
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = null;
          }

          let connectionTimeout: NodeJS.Timeout | undefined;
          let signalingTimeout: NodeJS.Timeout | undefined;
          
          const peer = new Peer({
            initiator,
            trickle: true,
            stream: stream,
            config: ICE_SERVERS,
            channelConfig: {
              ordered: true,
              maxRetransmits: 3
            }
          });
          
          peerRef.current = peer;
          console.log('[WebRTC] Nuevo peer creado. Initiator:', initiator);
          
          connectionTimeout = setTimeout(() => {
            if (!peer.connected && isComponentMounted) {
              console.warn('[WebRTC] Connection timeout. Destruyendo peer.');
              peer.destroy();
              handleNextChat();
            }
          }, CONNECTION_TIMEOUT);

          signalingTimeout = setTimeout(() => {
            if (!peer.connected && isComponentMounted) {
              console.warn('[WebRTC] Signaling timeout. Destruyendo peer.');
              peer.destroy();
              handleNextChat();
            }
          }, SIGNALING_TIMEOUT);

          peer.on('connect', () => {
            if (!isComponentMounted) return;
            
            clearTimeout(connectionTimeout);
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
            
            // Monitor calidad
            const markIntentionalDisconnect = monitorConnectionQuality(peer);
            markIntentionalDisconnectRef.current = markIntentionalDisconnect;
            console.log('[WebRTC] Peer conectado');
          });

          peer.on('signal', (signal) => {
            if (socketRef.current?.connected) {
              socketRef.current.emit("signal", { to: partnerID, signal });
            }
          });

          peer.on('stream', (partnerStream) => {
            if (!isComponentMounted) return;
            
            // Guardar el stream del compañero en el estado
            setPartnerStreamRef(partnerStream);
            
            // Solo asignar al video principal si no está activo el WebRTC Avanzado
            if (partnerVideo.current && !useEnhancedWebRTC) {
              partnerVideo.current.srcObject = partnerStream;
            }
            console.log('[WebRTC] Stream de compañero recibido');
          });
          
          peer.on('data', (data) => {
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

          peer.on('close', () => {
            if (!isComponentMounted) return;
            
            clearTimeout(connectionTimeout);
            clearTimeout(signalingTimeout);
            
            // Marcar como desconexión normal, no como error
            if (markIntentionalDisconnectRef.current) {
              markIntentionalDisconnectRef.current();
            }
            
             setStatus("Tu compañero se ha desconectado.");
             setConnectionStatus("disconnected");
            setConnectionQuality("good"); // Resetear a neutral, no a mala
            
            if (partnerVideo.current) {
              partnerVideo.current.srcObject = null;
            }
            setPartnerStreamRef(null);
            addCountry(["España", "México", "Argentina", "Colombia", "Chile", "Estados Unidos"][Math.floor(Math.random() * 6)]);
            console.log('[WebRTC] Peer cerrado - desconexión normal');
          });
          
          peer.on('error', (err) => { 
            if (!isComponentMounted) return;
            
            clearTimeout(connectionTimeout);
            clearTimeout(signalingTimeout);
            console.error('[WebRTC] Error en Peer:', err);
            
            // Solo marcar como error si es un error crítico
            if (err.message && (
              err.message.includes('ICE') || 
              err.message.includes('connection') ||
              err.message.includes('network')
            )) {
            handlePeerError(err);
            } else {
              // Para errores menores, solo log y continuar
              console.warn('[WebRTC] Error menor en peer:', err.message);
              setConnectionQuality("good");
            }
          });
        };

        socket.on("partner", (data: { id: string; initiator: boolean; }) => { 
          if (isComponentMounted) {
            setupPeer(data.id, data.initiator); 
          }
        });
        
        socket.on("signal", (data: { from: string; signal: Peer.SignalData; }) => { 
          if (peerRef.current && isComponentMounted) {
            peerRef.current.signal(data.signal); 
          }
        });

        socket.on("partner_disconnected", () => {
          if (!isComponentMounted) return;
          
            setStatus("Tu compañero se ha desconectado. Buscando uno nuevo...");
          if(peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = undefined;
          }
          const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
          socketRef.current?.emit('find_partner', { interests: interestsArray, ageFilter });
        });

        socket.on("partner_muted", (muted: boolean) => {
          if (isComponentMounted) {
          setIsPartnerMuted(muted);
          }
        });

        socket.on("partner_video_off", (videoOff: boolean) => {
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
      clearInterval(userCountInterval);
      
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerRef.current) {
        peerRef.current.removeAllListeners && peerRef.current.removeAllListeners();
        peerRef.current.destroy();
        peerRef.current = undefined;
      }
      
      socket.off('connect', onConnect);
      socket.off('user_count', onUserCount);
      socket.off("partner");
      socket.off("signal");
      socket.off("partner_disconnected");
      socket.off("partner_muted");
      socket.off("partner_video_off");
      
      socket.disconnect();
    };
  }, [interests, ageFilter]);
  
  // Efecto para manejar la restauración del stream del compañero cuando se cierra el WebRTC Avanzado
  useEffect(() => {
    if (!useEnhancedWebRTC && partnerStreamRef && partnerVideo.current) {
      partnerVideo.current.srcObject = partnerStreamRef;
    }
  }, [useEnhancedWebRTC, partnerStreamRef]);
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 relative">
        {(connectionStatus === "error" || connectionStatus === "banned") && <ConnectionErrorMessage />}
        
        {/* Contenedor principal de video - Mejorado */}
        <div className={`flex-1 flex flex-col ${useEnhancedWebRTC ? 'hidden' : ''}`}>
          <div className="w-full h-[60vh] lg:h-[70vh] bg-gradient-to-br from-black to-gray-900 rounded-2xl overflow-hidden relative video-container shadow-2xl border border-gray-700">
            <video 
              ref={partnerVideo} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover relative z-0" 
            />
            <video 
              ref={myVideo} 
              autoPlay 
              muted 
              playsInline
              className={`w-32 h-24 lg:w-56 lg:h-42 absolute right-4 lg:right-6 bottom-4 lg:bottom-6 rounded-xl object-cover ring-4 ring-gray-700 transition-all duration-300 shadow-lg z-50 ${myFilter} transform-gpu`} 
            />
            
            {/* Overlay de estado - Mejorado */}
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
            
            {/* Indicador de usuarios online - Mejorado */}
            <div className="absolute top-4 lg:top-6 right-4 lg:right-6 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base animate-fade-in z-10 font-medium shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>{onlineUsers} online</span>
              </div>
            </div>

            {/* Indicador de calidad de conexión - Mejorado */}
            <div className="absolute top-16 lg:top-20 right-4 lg:right-6 bg-black bg-opacity-70 backdrop-blur-sm text-white p-3 lg:p-4 rounded-xl connection-indicator z-10 border border-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connectionQuality === 'excellent' ? 'bg-green-500 animate-pulse' : connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm hidden sm:inline font-medium">
                  {connectionQuality === 'excellent' ? 'Excelente' : connectionQuality === 'good' ? 'Buena' : 'Mala'} conexión
                </span>
              </div>
            </div>

            {/* Indicadores de estado del compañero - Mejorado */}
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

          {/* Controles principales - Mejorados */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-3 lg:gap-4 p-4 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl border border-gray-700">
            {/* Filtros - Mejorados */}
            <div className="flex flex-wrap gap-2 lg:gap-3">
              <button onClick={() => setMyFilter('')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Normal</button>
              <button onClick={() => setMyFilter('grayscale')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">B&N</button>
              <button onClick={() => setMyFilter('sepia')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Sepia</button>
              <button onClick={() => setMyFilter('invert')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-600">Invertir</button>
            </div>
            
            {/* Controles de audio/video - Mejorados */}
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

            {/* Nuevas funcionalidades - Mejoradas */}
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

          {/* Grabador de pantalla */}
          {showScreenRecorder && (
            <div className="mt-6">
              <ScreenRecorder />
            </div>
          )}
        </div>

        {/* Panel de chat - Mejorado */}
        <div className={`w-full lg:w-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 lg:p-6 flex flex-col h-[50vh] lg:h-[70vh] shadow-2xl border border-gray-700 ${useEnhancedWebRTC ? 'hidden' : ''}`}>
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-white">Chat</h2>
          
          <div className="flex-grow overflow-y-auto mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-700 bg-opacity-50 backdrop-blur-sm rounded-xl custom-scrollbar border border-gray-600">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.author === "me" ? "text-right" : "text-left"}`}>
                <div className={`inline-block p-3 lg:p-4 rounded-2xl max-w-[85%] lg:max-w-sm shadow-lg ${
                  message.author === "me" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" 
                    : "bg-gradient-to-r from-gray-600 to-gray-700 text-white"
                }`}>
                  {message.type === "image" && message.imageUrl && (
                    <Image 
                      src={message.imageUrl} 
                      alt="Imagen compartida" 
                      width={150} 
                      height={100}
                      className="rounded-lg mb-2 w-full"
                    />
                  )}
                  <p className="text-sm lg:text-base">{message.text}</p>
                  <p className="text-xs opacity-70 mt-2">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="h-8">
            {isPartnerTyping && (
              <div className="typing-indicator">
                <span className="text-sm lg:text-base text-gray-400 italic">El compañero está escribiendo</span>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>

          {/* Controles de chat - Mejorados */}
          <div className="flex space-x-2 lg:space-x-3 mb-4">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-gray-500"
            >
              😀
            </button>
            <button 
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
          </div>

          {/* Selector de emojis - Mejorado */}
          {showEmojiPicker && (
            <div className="bg-gray-700 bg-opacity-80 backdrop-blur-sm p-3 lg:p-4 rounded-xl mb-4 emoji-grid border border-gray-600">
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

          {/* Formulario de mensaje - Mejorado */}
          <form onSubmit={handleSendMessage} className="flex space-x-2 lg:space-x-3">
            <input 
              ref={messageInputRef}
              type="text"
              name="message" 
              placeholder="Escribe un mensaje..." 
              onInput={handleTyping}
              className="flex-1 bg-gray-700 bg-opacity-80 backdrop-blur-sm text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl text-sm lg:text-base transition-all duration-200 hover:scale-105 shadow-lg border border-blue-500"
            >
              Enviar
            </button>
          </form>
        </div>

        {/* Modal de reporte */}
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

        {/* Modales de nuevas funcionalidades */}
        <ThemeSettings 
          isOpen={showThemeSettings} 
          onClose={() => setShowThemeSettings(false)} 
        />

        {showDashboard && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
            <UserDashboard />
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

        {/* WebRTC Mejorado */}
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
                  partnerStream={partnerStreamRef}
                  onStream={(stream) => {
                    // No asignar el stream del compañero al video principal cuando está activo el WebRTC Avanzado
                    // Esto evita la duplicación de streams
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
      </div>
    </div>
  );
};

export default ChatRoom; 