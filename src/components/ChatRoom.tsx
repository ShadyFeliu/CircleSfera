"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import ScreenRecorder from "./ScreenRecorder";

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

const ChatRoom = ({ interests, ageFilter }: { interests: string; ageFilter?: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Buscando un compañero...");
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

  // Emojis disponibles
  const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "😎", "🤣", "😭", "😱", "😴", "🤗", "😇"];

  useEffect(() => {
    // URL dinámica para el servidor de señalización
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://${window.location.hostname}:3001`;
    const socket = io(socketUrl);
    socketRef.current = socket;
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
          const peer = new Peer({ initiator, trickle: true, stream: myStream });
          peerRef.current = peer;

          setStatus("Conectado");
          setMessages([]);

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
             if (partnerVideo.current) { partnerVideo.current.srcObject = null; }
          });
          
          peer.on('error', (err) => { console.error('Error en Peer:', err); });
        };

        socket.on("partner", (data: { id: string; initiator: boolean; }) => { setupPeer(data.id, data.initiator); });
        socket.on("signal", (data: { from: string; signal: Peer.SignalData; }) => { peerRef.current?.signal(data.signal); });

        socket.on("partner_disconnected", () => {
            setStatus("Tu compañero se ha desconectado. Buscando uno nuevo...");
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
    const messageText = e.currentTarget.message.value;
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
      e.currentTarget.reset();
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
    if(partnerVideo.current) { partnerVideo.current.srcObject = null; }
    peerRef.current?.destroy();
    socketRef.current?.emit("find_new_partner");
  }

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
    <div className="w-full max-w-6xl grid grid-cols-3 gap-4">
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