"use client";

import { useState, useEffect } from "react";

type Stats = {
  totalChats: number;
  totalTime: number; // en minutos
  countriesVisited: string[];
  favoriteInterests: string[];
  lastActive: Date;
};

const Stats = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => {
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    totalTime: 0,
    countriesVisited: [],
    favoriteInterests: [],
    lastActive: new Date()
  });

  useEffect(() => {
    // Cargar estadísticas desde localStorage
    const savedStats = localStorage.getItem('circleSfera_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Mis Estadísticas</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-bold mb-2">📊 Actividad General</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Chats totales:</span>
                <div className="text-xl font-bold">{stats.totalChats}</div>
              </div>
              <div>
                <span className="text-gray-400">Tiempo total:</span>
                <div className="text-xl font-bold">{formatTime(stats.totalTime)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-bold mb-2">🌍 Países Visitados</h4>
            {stats.countriesVisited.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.countriesVisited.map((country, index) => (
                  <span key={index} className="bg-blue-600 px-2 py-1 rounded text-xs">
                    {country}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Aún no has chateado con usuarios de otros países</p>
            )}
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-bold mb-2">⭐ Intereses Favoritos</h4>
            {stats.favoriteInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.favoriteInterests.map((interest, index) => (
                  <span key={index} className="bg-green-600 px-2 py-1 rounded text-xs">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Añade intereses para ver tus favoritos</p>
            )}
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-bold mb-2">🕒 Última Actividad</h4>
            <p className="text-sm">
              {stats.lastActive.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem('circleSfera_stats');
              setStats({
                totalChats: 0,
                totalTime: 0,
                countriesVisited: [],
                favoriteInterests: [],
                lastActive: new Date()
              });
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Resetear Estadísticas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stats; 