"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import ScreenRecorder from "./ScreenRecorder";
import { useUserStats } from "@/hooks/useUserStats";

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
    // TURN servers from environment variables
    ...(process.env.NEXT_PUBLIC_TURN_URLS ? [{
      urls: process.env.NEXT_PUBLIC_TURN_URLS.split(','),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    }] : []),
  ],
  iceCandidatePoolSize: 10,
};

// Connection timeout constants
const CONNECTION_TIMEOUT = 15000; // 15 seconds
const SIGNALING_TIMEOUT = 10000; // 10 seconds

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

  // Emojis disponibles
  const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "😎", "🤣", "😭", "😱", "😴", "🤗", "😇"];

  // Connection initialization function
  const initializeConnection = () => {
    setConnectionStatus("connecting");
    
    // URL dinámica para el servidor de señalización
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${window.location.hostname}:3001`;
    const socket = io(socketUrl);
    socketRef.current = socket;
    let myStream: MediaStream;
    
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

  useEffect(() => {
    // Initialize socket connection
    const socket = initializeConnection();
    let myStream: MediaStream;

    socket.on('connect', () => {
      console.log('Conectado al servidor! Buscando pareja con intereses:', interests);
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      socket.emit('find_partner', { interests: interestsArray, ageFilter });
      socket.emit('get_user_count');
    });

    socket.on('user_count', (count: number) => {
      setOnlineUsers(count);
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Error: La cámara no es accesible en este navegador o la página no es segura (se requiere HTTPS).");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        myStream = stream;
        myStreamRef.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }

        const setupPeer = (partnerID: string, initiator: boolean) => {
          const peer = new Peer({
            initiator,
            trickle: true,
            stream: myStream,
            config: ICE_SERVERS,
            sdpTransform: (sdp) => {
              // Force use of DTLS-SRTP for security
              return sdp.replace('a=crypto', 'a=fingerprint');
            },
            // Additional security options
            trickleICE: true,
            reconnectTimer: 3000,
            iceCompleteTimeout: 5000,
            channelConfig: {
              ordered: true,
              maxRetransmits: 3
            }
          });
          
          peerRef.current = peer;

          // Set connection timeout
          const connectionTimeout = setTimeout(() => {
            if (!peer.connected) {
              console.log('Connection timeout - searching for new partner');
              peer.destroy();
              handleNextChat();
            }
          }, CONNECTION_TIMEOUT);

          // Set signaling timeout
          const signalingTimeout = setTimeout(() => {
            if (!peer.connected) {
              console.log('Signaling timeout - searching for new partner');
              peer.destroy();
              handleNextChat();
            }
          }, SIGNALING_TIMEOUT);

          peer.on('connect', () => {
            clearTimeout(connectionTimeout);
            clearTimeout(signalingTimeout);
            setStatus("Conectado");
            setConnectionStatus("connected");
            setMessages([]);
            
            // Increment chat count
            incrementChats();
            
            // Add interests to stats
            if (interests) {
              interests.split(',').forEach(interest => {
                if (interest.trim()) {
                  addInterest(interest.trim().toLowerCase());
                }
              });
            }
            
            // Start chat timer
            const chatStartTime = Date.now();
            
            // Monitor connection quality
            monitorConnectionQuality(peer);
            
            // Return cleanup function to record chat duration when connection ends
            return () => {
              const chatDuration = (Date.now() - chatStartTime) / 1000 / 60; // Convert to minutes
              if (chatDuration > 0.1) { // Only record if chat lasted more than 6 seconds
                addChatTime(Math.round(chatDuration));
              }
            };
          });

          peer.on("signal", (signal) => {
            socket.emit("signal", { to: partnerID, signal });
          });

          peer.on("stream", (partnerStream) => {
            if (partnerVideo.current) {
              partnerVideo.current.srcObject = partnerStream;
            }
          });
          
          peer.on("data", (data) => {
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
                
                // Reproducir sonido de notificación
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

          peer.on("close", () => {
             setStatus("Tu compañero se ha desconectado.");
             setConnectionStatus("disconnected");
             if (partnerVideo.current) { partnerVideo.current.srcObject = null; }
             
             // Add fictitious country data - in a real app, this would come from geolocation
             // This is just for demonstration purposes
             const countries = ["España", "México", "Argentina", "Colombia", "Chile", "Estados Unidos"];
             const randomCountry = countries[Math.floor(Math.random() * countries.length)];
             addCountry(randomCountry);
          });
          
          peer.on('error', (err) => { 
            console.error('Error en Peer:', err); 
            handlePeerError(err);
          });
        };

        socket.on("partner", (data: { id: string; initiator: boolean; }) => { setupPeer(data.id, data.initiator); });
        socket.on("signal", (data: { from: string; signal: Peer.SignalData; }) => { peerRef.current?.signal(data.signal); });

        socket.on("partner_disconnected", () => {
            setStatus("Tu compañero se ha desconectado. Buscando uno nuevo...");
            setConnectionStatus("waiting");
            if (partnerVideo.current) { partnerVideo.current.srcObject = null; }
            peerRef.current?.destroy();
            socket.emit("find_new_partner");
        });

        socket.on("partner_muted", (muted: boolean) => {
          setIsPartnerMuted(muted);
        });

        socket.on("partner_video_off", (videoOff: boolean) => {
          setIsPartnerVideoOff(videoOff);
        });
      })
      .catch(err => {
        console.error("Error al obtener media:", err);
        setStatus("No se pudo acceder a la cámara o micrófono.");
      });

    const handleFindNewPartner = () => {
      const interestsArray = interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      socketRef.current?.emit("find_new_partner", { interests: interestsArray, ageFilter });
    };

    return () => {
      myStream?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
      socket.disconnect();
    };
  }, [interests, ageFilter]);
  
  // Connection quality monitoring function
  const monitorConnectionQuality = (peer: Peer.Instance) => {
    let statsInterval: NodeJS.Timeout;
    
    peer.on('connect', () => {
      statsInterval = setInterval(async () => {
        if (peer.connected && (peer as any)._pc) {
          try {
            const stats = await (peer as any)._pc.getStats();
            let totalPacketsLost = 0;
            let totalPackets = 0;
            let roundTripTime = 0;
            
            stats.forEach((report: any) => {
              if (report.type === 'inbound-rtp') {
                totalPacketsLost += report.packetsLost || 0;
                totalPackets += report.packetsReceived || 0;
              }
              if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
                roundTripTime = report.currentRoundTripTime * 1000;
              }
            });
            
            const packetLossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
            
            // Update connection quality based on metrics
            if (packetLossRate > 10 || roundTripTime > 300) {
              setConnectionQuality("poor");
            } else if (packetLossRate > 5 || roundTripTime > 150) {
              setConnectionQuality("fair");
            } else {
              setConnectionQuality("good");
            }
          } catch (error) {
            console.error('Error getting WebRTC stats:', error);
          }
        }
      }, 5000);
    });
    
    return () => {
      if (statsInterval) clearInterval(statsInterval);
    };
  };
  
  // Handle WebRTC peer errors
  const handlePeerError = (error: Error) => {
    console.error('WebRTC error:', error);
    
    let errorMessage = 'Error de conexión';
    let reconnectable = true;

    if (error.message.includes('ICE')) {
      errorMessage = 'No se pudo establecer una conexión directa. Intentando reconectar...';
    } else if (error.message.includes('getUserMedia')) {
      errorMessage = 'No se pudo acceder a la cámara o micrófono';
      reconnectable = false;
    }

    setConnectionError({
      message: errorMessage,
      reconnectable
    });
    setConnectionStatus("error");
  };

  const sendData = (data: DataType) => {
    peerRef.current?.send(JSON.stringify(data));
  }

  const playNotificationSound = () => {
    // Crear un audio context para reproducir un beep simple
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const messageText = messageInputRef.current?.value;
    if (messageText) {
      const message: Message = { 
        author: "me", 
        text: messageText,
        timestamp: new Date(),
        type: "text"
      };
      setMessages((prev) => [...prev, message]);
      sendData({ type: "chat", text: messageText, messageType: "text" });
      sendData({ type: "typing", value: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      messageInputRef.current!.value = '';
    }
  };

  const handleSendEmoji = (emoji: string) => {
    const message: Message = { 
      author: "me", 
      text: emoji,
      timestamp: new Date(),
      type: "text"
    };
    setMessages((prev) => [...prev, message]);
    sendData({ type: "chat", text: emoji, messageType: "text" });
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const message: Message = { 
          author: "me", 
          text: "Imagen compartida",
          timestamp: new Date(),
          type: "image",
          imageUrl
        };
        setMessages((prev) => [...prev, message]);
        sendData({ type: "chat", text: "Imagen compartida", messageType: "image", imageUrl });
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

  const handleNextChat = () => {
    setStatus("Buscando un compañero...");
    setConnectionStatus("waiting");
    if(partnerVideo.current) { partnerVideo.current.srcObject = null; }
    peerRef.current?.destroy();
    socketRef.current?.emit("find_new_partner");
  }
  
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
    <div className="w-full max-w-6xl grid grid-cols-3 gap-4 relative">
      {(connectionStatus === "error" || connectionStatus === "banned") && <ConnectionErrorMessage />}
      <div className="col-span-2 flex flex-col">
        <div className="w-full h-[32rem] bg-black rounded-lg overflow-hidden relative video-container">
          <video ref={partnerVideo} autoPlay className="w-full h-full object-cover" />
          <video ref={myVideo} autoPlay muted className={`w-48 h-36 absolute right-4 bottom-4 rounded-md object-cover ring-2 ring-gray-700 transition-all duration-300 ${myFilter} ${isVideoOff ? 'hidden' : ''}`} />
          
          {/* Overlay de estado */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded animate-fade-in z-10">
            {status}
          </div>
          
          {/* Indicador de usuarios online */}
          <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded text-sm animate-fade-in z-10">
            {onlineUsers} online
          </div>

          {/* Indicador de calidad de conexión - movido a la parte superior derecha */}
          <div className="absolute top-12 right-4 bg-black bg-opacity-50 text-white p-2 rounded connection-indicator z-10">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${connectionQuality === 'good' ? 'bg-green-500' : connectionQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-xs">{connectionQuality === 'good' ? 'Buena' : connectionQuality === 'fair' ? 'Regular' : 'Mala'} conexión</span>
            </div>
          </div>

          {/* Indicadores de estado del compañero - posicionados para no superponerse */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {isPartnerMuted && (
              <div className="bg-red-600 text-white px-2 py-1 rounded animate-fade-in text-xs">
                🔇 Silenciado
              </div>
            )}
            
            {isPartnerVideoOff && (
              <div className="bg-gray-600 text-white px-2 py-1 rounded animate-fade-in text-xs">
                📹 Sin video
              </div>
            )}
          </div>
        </div>

        {/* Controles principales */}
        <div className="mt-4 flex justify-center items-center space-x-4">
          <div className="flex space-x-2">
            <button onClick={() => setMyFilter('')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors">Normal</button>
            <button onClick={() => setMyFilter('grayscale')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors">B&N</button>
            <button onClick={() => setMyFilter('sepia')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors">Sepia</button>
            <button onClick={() => setMyFilter('invert')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors">Invertir</button>
          </div>
          
          {/* Controles de audio/video */}
          <button 
            onClick={toggleMute} 
            className={`font-bold py-2 px-4 rounded-full text-sm transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <button 
            onClick={toggleVideo} 
            aria-label="Activar/desactivar video"
            className={`font-bold py-2 px-4 rounded-full text-sm transition-colors ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>

          <button onClick={handleNextChat} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full text-lg transition-transform transform hover:scale-105">
            Siguiente
          </button>

          <button 
            onClick={() => setShowReportModal(true)} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
          >
            Reportar
          </button>

          <button 
            onClick={() => setShowScreenRecorder(!showScreenRecorder)} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
          >
            🎥
          </button>
        </div>

        {/* Grabador de pantalla */}
        {showScreenRecorder && (
          <div className="mt-4">
            <ScreenRecorder />
          </div>
        )}
      </div>

      {/* Panel de chat */}
      <div className="col-span-1 bg-gray-800 rounded-lg p-4 flex flex-col h-full max-h-[36rem]">
        <h2 className="text-xl font-bold mb-4">Chat</h2>
        
        <div className="flex-grow overflow-y-auto mb-4 p-2 bg-gray-700 rounded-md custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`my-2 chat-message ${msg.author === 'me' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${msg.author === 'me' ? 'bg-blue-600' : 'bg-gray-600'} max-w-xs`}>
                {msg.type === 'image' && msg.imageUrl ? (
                  <img src={msg.imageUrl} alt="Imagen compartida" className="max-w-full rounded" />
                ) : (
                  <span>{msg.text}</span>
                )}
                <div className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="h-6">
          {isPartnerTyping && (
            <div className="typing-indicator">
              <span className="text-sm text-gray-400 italic">El compañero está escribiendo</span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
        </div>

        {/* Controles de chat */}
        <div className="flex space-x-2 mb-2">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            😀
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            aria-label="Enviar imagen"
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
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

        {/* Selector de emojis */}
        {showEmojiPicker && (
          <div className="bg-gray-700 p-2 rounded mb-2 emoji-grid">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleSendEmoji(emoji)}
                className="emoji-button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage}>
          <input 
            ref={messageInputRef}
            name="message" 
            onKeyDown={handleTyping} 
            className="w-full p-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            placeholder="Escribe un mensaje..." 
          />
        </form>
      </div>

      {/* Modal de reportar usuario */}
      {showReportModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Reportar Usuario</h3>
            <p className="text-gray-300 mb-4">¿Por qué quieres reportar a este usuario?</p>
            <div className="space-y-2">
              <button 
                onClick={() => reportUser("Contenido inapropiado")}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
              >
                Contenido inapropiado
              </button>
              <button 
                onClick={() => reportUser("Comportamiento abusivo")}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
              >
                Comportamiento abusivo
              </button>
              <button 
                onClick={() => reportUser("Spam")}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
              >
                Spam
              </button>
              <button 
                onClick={() => setShowReportModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 