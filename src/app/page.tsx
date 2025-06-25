"use client";

import { useState, useEffect } from "react";
import ChatRoom from "@/components/ChatRoom";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  console.log('🏠 Home component iniciando...');
  
  const [interests, setInterests] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { toggleTheme, colorScheme } = useTheme();

  console.log('🔍 Estado actual - showChat:', showChat, 'interests:', interests, 'ageFilter:', ageFilter);

  const handleStartChat = () => {
    console.log('🚀 handleStartChat ejecutado');
    setShowChat(true);
  };

  const handleBackToHome = () => {
    setShowChat(false);
    setInterests("");
    setAgeFilter("");
  };

  if (showChat) {
    console.log('🎬 Renderizando ChatRoom porque showChat es true');
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center relative pt-16 sm:pt-20">
        <button
          onClick={handleBackToHome}
          className="absolute top-8 left-2 sm:top-12 sm:left-8 z-50 bg-gray-800/80 hover:bg-gray-700 text-white px-5 py-2 rounded-full transition-all shadow-lg border border-gray-600 text-base font-semibold opacity-80 hover:opacity-100 backdrop-blur"
        >
          ← Volver
        </button>
        <ChatRoom interests={interests} ageFilter={ageFilter} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white flex flex-col justify-center items-center">
      {/* Header con controles de tema */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex space-x-2">
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

      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12 md:py-16 flex flex-col justify-center items-center w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent break-words">
            CircleSfera
          </h1>
          <p className="text-base sm:text-xl md:text-2xl mb-4 sm:mb-8 text-gray-300">
            Conecta con personas increíbles de todo el mundo
          </p>
        </div>

        {/* Nuevas funcionalidades destacadas */}
        {showFeatures && (
          <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
            <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center">✨ Nuevas Funcionalidades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎨</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">Temas Personalizables</h3>
                <p className="text-xs sm:text-sm text-gray-300">Modo oscuro/claro y 6 esquemas de colores diferentes</p>
              </div>
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📊</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">Dashboard Personal</h3>
                <p className="text-xs sm:text-sm text-gray-300">Estadísticas detalladas, analytics y logros desbloqueables</p>
              </div>
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">Preferencias Avanzadas</h3>
                <p className="text-xs sm:text-sm text-gray-300">Filtros por idioma, país, edad e intereses</p>
              </div>
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📤</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">Integración Social</h3>
                <p className="text-xs sm:text-sm text-gray-300">Compartir en redes sociales y códigos de invitación</p>
              </div>
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⚡</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">WebRTC Mejorado</h3>
                <p className="text-xs sm:text-sm text-gray-300">Filtros de video, grabación, screenshots y estadísticas</p>
              </div>
              <div className="bg-white bg-opacity-5 p-3 sm:p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🔒</div>
                <h3 className="font-bold mb-1 sm:mb-2 text-base sm:text-lg">Seguridad Avanzada</h3>
                <p className="text-xs sm:text-sm text-gray-300">Mejor protección y moderación de contenido</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-full sm:max-w-2xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Comienza tu aventura</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="interests" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  ¿Qué te interesa? (opcional)
                </label>
                <input
                  id="interests"
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Ej: música, tecnología, viajes, deportes..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-base"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ayuda a encontrar personas con intereses similares
                </p>
              </div>

              <div>
                <label htmlFor="ageFilter" className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Filtro de edad (opcional)
                </label>
                <select
                  id="ageFilter"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-base"
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
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-base sm:text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                🚀 Comenzar Chat
              </button>
            </div>
          </div>

          <div className="text-center text-gray-300 text-xs sm:text-sm">
            <p>Al hacer clic en &quot;Comenzar Chat&quot;, aceptas nuestros términos de servicio y política de privacidad.</p>
            <p className="mt-2">
              <span className="text-green-400">✓</span> Conexiones seguras
              <span className="mx-1 sm:mx-2">•</span>
              <span className="text-green-400">✓</span> Sin registro requerido
              <span className="mx-1 sm:mx-2">•</span>
              <span className="text-green-400">✓</span> Totalmente gratuito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 