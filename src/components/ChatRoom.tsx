/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import ScreenRecorder from "./ScreenRecorder";
import { useUserStats } from "@/hooks/useUserStats";
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
  const [connectionQuality, setConnectionQuality] = useState<"good" | "fair" | "poor">("good");

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
    setConnectionQuality("fair");
    
    setMessages([]);
    setStatus("Buscando un compañero...");
    setConnectionStatus("waiting");
    setIsPartnerMuted(false);
    setIsPartnerVideoOff(false);
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
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

        myStream = stream;
        myStreamRef.current = stream;
        
        // Asignar stream solo una vez al video
        if (myVideo.current && !myVideo.current.srcObject) {
          myVideo.current.srcObject = stream;
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
            
            if (partnerVideo.current) {
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
            setStatus("Tu compañero se ha desconectado.");
            setConnectionStatus("disconnected");
            if (partnerVideo.current) {
              partnerVideo.current.srcObject = null;
            }
            addCountry(["España", "México", "Argentina", "Colombia", "Chile", "Estados Unidos"][Math.floor(Math.random() * 6)]);
            console.log('[WebRTC] Peer cerrado');
          });
          
          peer.on('error', (err) => {
            if (!isComponentMounted) return;
            
            clearTimeout(connectionTimeout);
            clearTimeout(signalingTimeout);
            console.error('[WebRTC] Error en Peer:', err);
            handlePeerError(err);
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
      .catch(err => {
        console.error("Error al obtener media:", err);
        if (isComponentMounted) {
          setStatus("No se pudo acceder a la cámara o micrófono.");
        }
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
      setConnectionQuality("fair");
    }

    // Configurar intervalos para monitorear la calidad solo si está conectado
    const interval = setInterval(() => {
      if (peer.connected) {
        setConnectionQuality("good");
      } else if (!peer.destroyed) {
        setConnectionQuality("fair");
      }
      // No cambiamos a "poor" automáticamente para evitar falsos positivos
    }, 10000); // Aumentar intervalo a 10 segundos

    // Limpiar intervalo cuando el peer se destruya
    peer.on('close', () => {
      clearInterval(interval);
      // Solo marcar como mala si no fue intencional
      if (!isIntentionalDisconnect) {
        setConnectionQuality("poor");
      }
    });

    peer.on('connect', () => {
      setConnectionQuality("good");
    });

    peer.on('error', (err) => {
      console.warn('[WebRTC] Error en peer (puede ser normal):', err);
      // Solo marcar como mala si es un error crítico
      if (err.message && err.message.includes('ICE')) {
        setConnectionQuality("poor");
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

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 relative min-h-screen">
      {(connectionStatus === "error" || connectionStatus === "banned") && <ConnectionErrorMessage />}
      
      {/* Contenedor principal de video */}
      <div className="flex-1 flex flex-col">
        <div className="w-full h-[50vh] lg:h-[32rem] bg-black rounded-lg overflow-hidden relative video-container">
          <video 
            ref={partnerVideo} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover" 
          />
          <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline
            className={`w-24 h-18 lg:w-48 lg:h-36 absolute right-2 lg:right-4 bottom-2 lg:bottom-4 rounded-md object-cover ring-2 ring-gray-700 transition-all duration-300 ${myFilter} ${isVideoOff ? 'hidden' : ''}`} 
          />
          
          {/* Overlay de estado - responsive */}
          <div className="absolute top-2 lg:top-4 left-2 lg:left-4 bg-black bg-opacity-50 text-white p-1 lg:p-2 rounded animate-fade-in z-10 text-xs lg:text-sm">
            {status}
          </div>
          
          {/* Indicador de usuarios online - responsive */}
          <div className="absolute top-2 lg:top-4 right-2 lg:right-4 bg-green-600 text-white px-1 lg:px-2 py-1 rounded text-xs lg:text-sm animate-fade-in z-10">
            {onlineUsers} online
          </div>

          {/* Indicador de calidad de conexión - responsive */}
          <div className="absolute top-8 lg:top-12 right-2 lg:right-4 bg-black bg-opacity-50 text-white p-1 lg:p-2 rounded connection-indicator z-10">
            <div className="flex items-center space-x-1">
              <div className={`w-1 lg:w-2 h-1 lg:h-2 rounded-full ${connectionQuality === 'good' ? 'bg-green-500' : connectionQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-xs hidden sm:inline">{connectionQuality === 'good' ? 'Buena' : connectionQuality === 'fair' ? 'Regular' : 'Mala'} conexión</span>
            </div>
          </div>

          {/* Indicadores de estado del compañero - responsive */}
          <div className="absolute top-1 lg:top-2 left-1/2 transform -translate-x-1/2 flex space-x-1 lg:space-x-2 z-10">
            {isPartnerMuted && (
              <div className="bg-red-600 text-white px-1 lg:px-2 py-1 rounded animate-fade-in text-xs">
                🔇
              </div>
            )}
            
            {isPartnerVideoOff && (
              <div className="bg-gray-600 text-white px-1 lg:px-2 py-1 rounded animate-fade-in text-xs">
                📹
              </div>
            )}
          </div>
        </div>

        {/* Controles principales - responsive */}
        <div className="mt-2 lg:mt-4 flex flex-wrap justify-center items-center gap-2 lg:gap-4 p-2">
          {/* Filtros - responsive */}
          <div className="flex flex-wrap gap-1 lg:gap-2">
            <button onClick={() => setMyFilter('')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors">Normal</button>
            <button onClick={() => setMyFilter('grayscale')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors">B&N</button>
            <button onClick={() => setMyFilter('sepia')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors">Sepia</button>
            <button onClick={() => setMyFilter('invert')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors">Invertir</button>
          </div>
          
          {/* Controles de audio/video - responsive */}
          <button 
            onClick={toggleMute} 
            className={`font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <button 
            onClick={toggleVideo} 
            aria-label="Activar/desactivar video"
            className={`font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>

          <button onClick={handleNextChat} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 lg:py-2 px-3 lg:px-6 rounded-full text-sm lg:text-lg transition-transform transform hover:scale-105">
            Siguiente
          </button>

          <button 
            onClick={() => setShowReportModal(true)} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors"
          >
            Reportar
          </button>

          <button 
            onClick={() => setShowScreenRecorder(!showScreenRecorder)}
            disabled={connectionStatus !== 'connected'}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 lg:py-2 px-2 lg:px-4 rounded-full text-xs lg:text-sm transition-colors"
          >
            🎥
          </button>
        </div>

        {/* Grabador de pantalla */}
        {showScreenRecorder && (
          <div className="mt-2 lg:mt-4">
            <ScreenRecorder />
          </div>
        )}
      </div>

      {/* Panel de chat - responsive */}
      <div className="w-full lg:w-80 bg-gray-800 rounded-lg p-2 lg:p-4 flex flex-col h-[40vh] lg:h-[36rem]">
        <h2 className="text-lg lg:text-xl font-bold mb-2 lg:mb-4">Chat</h2>
        
        <div className="flex-grow overflow-y-auto mb-2 lg:mb-4 p-1 lg:p-2 bg-gray-700 rounded-md custom-scrollbar">
          {messages.map((message, index) => (
            <div key={index} className={`mb-2 ${message.author === "me" ? "text-right" : "text-left"}`}>
              <div className={`inline-block p-1 lg:p-2 rounded-lg max-w-[80%] lg:max-w-xs ${
                message.author === "me" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-600 text-white"
              }`}>
                {message.type === "image" && message.imageUrl && (
                  <Image 
                    src={message.imageUrl} 
                    alt="Imagen compartida" 
                    width={150} 
                    height={100}
                    className="rounded mb-1 w-full"
                  />
                )}
                <p className="text-xs lg:text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="h-6">
          {isPartnerTyping && (
            <div className="typing-indicator">
              <span className="text-xs lg:text-sm text-gray-400 italic">El compañero está escribiendo</span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
        </div>

        {/* Controles de chat - responsive */}
        <div className="flex space-x-1 lg:space-x-2 mb-2">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="bg-gray-600 hover:bg-gray-500 text-white px-2 lg:px-3 py-1 rounded text-xs lg:text-sm transition-colors"
          >
            😀
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            aria-label="Enviar imagen"
            className="bg-gray-600 hover:bg-gray-500 text-white px-2 lg:px-3 py-1 rounded text-xs lg:text-sm transition-colors"
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

        {/* Selector de emojis - responsive */}
        {showEmojiPicker && (
          <div className="bg-gray-700 p-1 lg:p-2 rounded mb-2 emoji-grid">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleSendEmoji(emoji)}
                className="emoji-button text-sm lg:text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Formulario de mensaje - responsive */}
        <form onSubmit={handleSendMessage} className="flex space-x-1 lg:space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            name="message"
            placeholder="Escribe un mensaje..."
            onInput={handleTyping}
            className="flex-1 bg-gray-700 text-white px-2 lg:px-3 py-1 lg:py-2 rounded text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 lg:px-4 py-1 lg:py-2 rounded text-xs lg:text-sm transition-colors"
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
    </div>
  );
};

export default ChatRoom; 