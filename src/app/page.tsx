"use client";

import { useState, useEffect } from "react";
import ChatRoom from "@/components/ChatRoom";
import Stats from "@/components/Stats";

type FavoriteInterest = {
  text: string;
  count: number;
};

export default function Home() {
  const [interests, setInterests] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [favoriteInterests, setFavoriteInterests] = useState<FavoriteInterest[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [ageFilter, setAgeFilter] = useState("all");

  useEffect(() => {
    // Cargar intereses favoritos desde localStorage
    const savedFavorites = localStorage.getItem('circleSfera_favorites');
    if (savedFavorites) {
      setFavoriteInterests(JSON.parse(savedFavorites));
    }
  }, []);

  const handleStartChat = () => {
    if (interests.trim()) {
      // Guardar interés en favoritos
      const newInterest = interests.trim().toLowerCase();
      const existingIndex = favoriteInterests.findIndex(fav => fav.text === newInterest);
      
      if (existingIndex >= 0) {
        const updated = [...favoriteInterests];
        updated[existingIndex].count += 1;
        setFavoriteInterests(updated);
      } else {
        setFavoriteInterests(prev => [...prev, { text: newInterest, count: 1 }]);
      }
      
      // Guardar en localStorage
      const updatedFavorites = existingIndex >= 0 
        ? favoriteInterests.map((fav, i) => i === existingIndex ? { ...fav, count: fav.count + 1 } : fav)
        : [...favoriteInterests, { text: newInterest, count: 1 }];
      localStorage.setItem('circleSfera_favorites', JSON.stringify(updatedFavorites));
    }
    
    setIsChatting(true);
  };

  const handleFavoriteClick = (favorite: string) => {
    setInterests(favorite);
  };

  const removeFavorite = (text: string) => {
    const updated = favoriteInterests.filter(fav => fav.text !== text);
    setFavoriteInterests(updated);
    localStorage.setItem('circleSfera_favorites', JSON.stringify(updated));
  };

  const shareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'CircleSfera',
        text: '¡Chatea con gente de todo el mundo en CircleSfera!',
        url: window.location.href
      });
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gray-900 text-white text-center">
      {isChatting ? (
        <ChatRoom interests={interests} ageFilter={ageFilter} />
      ) : (
        <>
          <h1 className="text-5xl font-bold mb-4">CircleSfera</h1>
          <p className="text-lg text-gray-400 mb-8">Chatea con gente de todo el mundo. Añade tus intereses para encontrar a alguien afín.</p>
          
          <div className="w-full max-w-md">
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: música, programación, viajes (separados por coma)"
            />
            
            {/* Filtro de edad */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Filtro de edad:</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las edades</option>
                <option value="13-17">13-17 años</option>
                <option value="18-25">18-25 años</option>
                <option value="26-35">26-35 años</option>
                <option value="36+">36+ años</option>
              </select>
            </div>
            
            {/* Intereses favoritos */}
            {favoriteInterests.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {showFavorites ? 'Ocultar' : 'Mostrar'} intereses favoritos
                </button>
                
                {showFavorites && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-md">
                    <h4 className="text-sm font-bold mb-2">Tus intereses favoritos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {favoriteInterests
                        .sort((a, b) => b.count - a.count)
                        .map((favorite, index) => (
                          <div key={index} className="flex items-center bg-gray-700 px-2 py-1 rounded text-xs">
                            <button 
                              onClick={() => handleFavoriteClick(favorite.text)}
                              className="hover:text-blue-300 mr-1"
                            >
                              {favorite.text}
                            </button>
                            <span className="text-gray-400 mr-1">({favorite.count})</span>
                            <button 
                              onClick={() => removeFavorite(favorite.text)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={handleStartChat}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl transition-transform transform hover:scale-105"
            >
              Buscar Chat
            </button>
          </div>

          {/* Botones de funcionalidades sociales */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setShowStats(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
            >
              📊 Mis Estadísticas
            </button>
            
            <button 
              onClick={shareApp}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors"
            >
              📤 Compartir App
            </button>
            
            <button 
              onClick={() => window.open('https://github.com', '_blank')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
            >
              ⭐ Dar Feedback
            </button>
          </div>

          {/* Información adicional */}
          <div className="mt-8 text-sm text-gray-500 max-w-lg">
            <p className="mb-2">
              💡 <strong>Consejo:</strong> Añade intereses específicos para encontrar personas con gustos similares.
            </p>
            <p className="mb-2">
              🔒 <strong>Privacidad:</strong> Tus conversaciones son privadas y no se graban.
            </p>
            <p className="mb-2">
              🛡️ <strong>Seguridad:</strong> Usa el filtro de edad para una experiencia más segura.
            </p>
            <p>
              🌍 <strong>Global:</strong> Conecta con personas de todo el mundo.
            </p>
          </div>
        </>
      )}

      {/* Modal de estadísticas */}
      <Stats isVisible={showStats} onClose={() => setShowStats(false)} />
    </main>
  );
} 