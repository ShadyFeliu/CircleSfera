"use client";

import { useState, useEffect } from "react";
import ChatRoom from "@/components/ChatRoom";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const [interests, setInterests] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { toggleTheme, colorScheme } = useTheme();

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleBackToHome = () => {
    setShowChat(false);
    setInterests("");
    setAgeFilter("");
  };

  if (showChat) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <ChatRoom interests={interests} ageFilter={ageFilter} />
        <button
          onClick={handleBackToHome}
          className="fixed top-4 left-4 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors z-10 shadow-lg border border-gray-600 text-sm"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white">
      {/* Header con controles de tema */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={toggleTheme}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
          title="Cambiar tema"
        >
          🌙
        </button>
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
          title="Nuevas funcionalidades"
        >
          ✨
        </button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CircleSfera
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Conecta con personas increíbles de todo el mundo
          </p>
        </div>

        {/* Nuevas funcionalidades destacadas */}
        {showFeatures && (
          <div className="mb-12 p-6 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-center">✨ Nuevas Funcionalidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="font-bold mb-2">Temas Personalizables</h3>
                <p className="text-sm text-gray-300">Modo oscuro/claro y 6 esquemas de colores diferentes</p>
              </div>
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold mb-2">Dashboard Personal</h3>
                <p className="text-sm text-gray-300">Estadísticas detalladas, analytics y logros desbloqueables</p>
              </div>
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold mb-2">Preferencias Avanzadas</h3>
                <p className="text-sm text-gray-300">Filtros por idioma, país, edad e intereses</p>
              </div>
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">📤</div>
                <h3 className="font-bold mb-2">Integración Social</h3>
                <p className="text-sm text-gray-300">Compartir en redes sociales y códigos de invitación</p>
              </div>
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold mb-2">WebRTC Mejorado</h3>
                <p className="text-sm text-gray-300">Filtros de video, grabación, screenshots y estadísticas</p>
              </div>
              <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-bold mb-2">Seguridad Avanzada</h3>
                <p className="text-sm text-gray-300">Mejor protección y moderación de contenido</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Comienza tu aventura</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="interests" className="block text-sm font-medium mb-2">
                  ¿Qué te interesa? (opcional)
                </label>
                <input
                  id="interests"
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Ej: música, tecnología, viajes, deportes..."
                  className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ayuda a encontrar personas con intereses similares
                </p>
              </div>

              <div>
                <label htmlFor="ageFilter" className="block text-sm font-medium mb-2">
                  Filtro de edad (opcional)
                </label>
                <select
                  id="ageFilter"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Cualquier edad</option>
                  <option value="18-25">18-25 años</option>
                  <option value="26-35">26-35 años</option>
                  <option value="36-45">36-45 años</option>
                  <option value="46+">46+ años</option>
                </select>
              </div>

              <button
                onClick={handleStartChat}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                🚀 Comenzar Chat
              </button>
            </div>
          </div>

          <div className="text-center text-gray-300 text-sm">
            <p>Al hacer clic en &quot;Comenzar Chat&quot;, aceptas nuestros términos de servicio y política de privacidad.</p>
            <p className="mt-2">
              <span className="text-green-400">✓</span> Conexiones seguras
              <span className="mx-2">•</span>
              <span className="text-green-400">✓</span> Sin registro requerido
              <span className="mx-2">•</span>
              <span className="text-green-400">✓</span> Totalmente gratuito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 