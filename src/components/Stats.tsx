"use client";

import { useEffect, useState } from 'react';

type PerformanceMetricsSummary = {
  total: number;
  last24h: number;
  byMetric: Record<string, {
    count: number;
    avgValue: number;
    goodCount: number;
    poorCount: number;
  }>;
};

type UserStats = {
  totalChats: number;
  totalTime: number;
  countriesVisited: string[];
  favoriteInterests: string[];
  lastActive: Date;
};

type TabType = 'performance' | 'user';

export default function Stats({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetricsSummary | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalChats: 0,
    totalTime: 0,
    countriesVisited: [],
    favoriteInterests: [],
    lastActive: new Date()
  });
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadStats();
    }
  }, [isVisible]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load user stats from localStorage
      const savedStats = localStorage.getItem('circleSfera_stats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setUserStats({
          ...parsedStats,
          lastActive: new Date(parsedStats.lastActive)
        });
      }

      // Load performance metrics from API
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Error fetching metrics');
      const data = await response.json();
      setPerformanceMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const resetUserStats = () => {
    const newStats = {
      totalChats: 0,
      totalTime: 0,
      countriesVisited: [],
      favoriteInterests: [],
      lastActive: new Date()
    };
    localStorage.removeItem('circleSfera_stats');
    setUserStats(newStats);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Dashboard de CircleSfera</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-2 rounded ${activeTab === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            📊 Estadísticas de Usuario
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded ${activeTab === 'performance' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            ⚡ Métricas de Rendimiento
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div>
            {/* User Stats Tab */}
            {activeTab === 'user' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded">
                    <h4 className="font-bold mb-2">📊 Actividad General</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Chats totales:</span>
                        <div className="text-xl font-bold">{userStats.totalChats}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Tiempo total:</span>
                        <div className="text-xl font-bold">{formatTime(userStats.totalTime)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <h4 className="font-bold mb-2">🕒 Última Actividad</h4>
                    <p className="text-sm">
                      {userStats.lastActive.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-bold mb-2">🌍 Países Visitados</h4>
                  {userStats.countriesVisited.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userStats.countriesVisited.map((country, index) => (
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
                  {userStats.favoriteInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userStats.favoriteInterests.map((interest, index) => (
                        <span key={index} className="bg-green-600 px-2 py-1 rounded text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Añade intereses para ver tus favoritos</p>
                  )}
                </div>

                <button
                  onClick={resetUserStats}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                >
                  Resetear Estadísticas
                </button>
              </div>
            )}

            {/* Performance Metrics Tab */}
            {activeTab === 'performance' && performanceMetrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded">
                    <h3 className="text-lg font-semibold mb-2">Total Métricas</h3>
                    <p className="text-2xl">{performanceMetrics.total}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <h3 className="text-lg font-semibold mb-2">Últimas 24h</h3>
                    <p className="text-2xl">{performanceMetrics.last24h}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(performanceMetrics.byMetric).map(([name, stats]) => (
                    <div key={name} className="bg-gray-700 p-4 rounded">
                      <h3 className="text-lg font-semibold mb-2">{name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Promedio</p>
                          <p className="text-xl">{stats.avgValue.toFixed(2)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Calidad</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">{stats.goodCount}</span>
                            <span>/</span>
                            <span className="text-red-500">{stats.poorCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
