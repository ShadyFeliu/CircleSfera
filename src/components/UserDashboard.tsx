"use client";

import React, { useState, useEffect } from 'react';
import { useUserStats } from '../hooks/useUserStats';
import dynamic from "next/dynamic";
import { Suspense } from "react";

interface DashboardStats {
  totalConnections: number;
  totalTime: number;
  averageSessionTime: number;
  favoriteTime: string;
  connectionsToday: number;
  connectionsThisWeek: number;
  connectionsThisMonth: number;
  countriesVisited: string[];
  languagesSpoken: string[];
  connectionQuality: {
    excellent: number;
    good: number;
    poor: number;
  };
}

type DashboardTab = 'overview' | 'analytics' | 'achievements';

const UserDashboard = dynamic(() => import("./UserDashboard"));
const EnhancedWebRTC = dynamic(() => import("./EnhancedWebRTC"));

type WebRTCMetrics = {
  [key: string]: {
    avgValue: number;
    goodCount: number;
    poorCount: number;
    count: number;
  };
};

const UserDashboardComponent: React.FC = () => {
  const { stats } = useUserStats();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalConnections: 0,
    totalTime: 0,
    averageSessionTime: 0,
    favoriteTime: 'N/A',
    connectionsToday: 0,
    connectionsThisWeek: 0,
    connectionsThisMonth: 0,
    countriesVisited: [],
    languagesSpoken: [],
    connectionQuality: { excellent: 0, good: 0, poor: 0 }
  });

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Estado para métricas WebRTC
  const [webrtcMetrics, setWebrtcMetrics] = useState<WebRTCMetrics | null>(null);

  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Intentar obtener el username del usuario autenticado desde localStorage
    const userData = localStorage.getItem('circleSfera_user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUsername(parsed.username || null);
      } catch {
        setUsername(null);
      }
    }
  }, []);

  useEffect(() => {
    // Simular datos del dashboard (en producción vendrían del backend)
    const mockStats: DashboardStats = {
      totalConnections: stats.totalChats || 42,
      totalTime: stats.totalTime || 1260, // minutos
      averageSessionTime: stats.totalTime > 0 && stats.totalChats > 0 ? Math.round(stats.totalTime / stats.totalChats) : 30,
      favoriteTime: '20:00 - 22:00',
      connectionsToday: 3,
      connectionsThisWeek: 12,
      connectionsThisMonth: 45,
      countriesVisited: stats.countriesVisited.length > 0 ? stats.countriesVisited : ['España', 'México', 'Argentina', 'Colombia', 'Chile'],
      languagesSpoken: ['Español', 'Inglés', 'Portugués'],
      connectionQuality: { excellent: 25, good: 12, poor: 5 }
    };
    setDashboardStats(mockStats);
  }, [stats]);

  useEffect(() => {
    // Cargar métricas agregadas del backend
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => setWebrtcMetrics(data.byMetric))
      .catch(() => setWebrtcMetrics(null));
  }, []);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQualityPercentage = (quality: 'excellent' | 'good' | 'poor'): number => {
    const total = dashboardStats.connectionQuality.excellent + 
                  dashboardStats.connectionQuality.good + 
                  dashboardStats.connectionQuality.poor;
    return total > 0 ? Math.round((dashboardStats.connectionQuality[quality] / total) * 100) : 0;
  };

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: string }> = ({ 
    title, value, subtitle, icon 
  }) => (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 lg:p-8 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              📊 Mi Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Estadísticas y análisis de tus conexiones
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm text-gray-300 px-4 py-3 rounded-xl border border-gray-600">
            <div className="text-sm">Última actualización:</div>
            <div className="font-medium">{new Date().toLocaleString('es-ES')}</div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          {username ? (
            <a
              href={`/@${username}`}
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold py-2 px-6 rounded-xl text-base transition-all duration-200 hover:scale-105 shadow-lg border border-blue-500"
              title="Ver mi perfil"
            >
              👤 Mi Perfil
            </a>
          ) : (
            <span className="text-gray-400 text-sm">Configura tu usuario para acceder a tu perfil</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center border-b border-gray-700 bg-gray-800 bg-opacity-30 backdrop-blur-sm rounded-2xl p-4">
          {[
            { id: 'overview', name: 'Resumen', icon: '📊' },
            { id: 'analytics', name: 'Analytics', icon: '📈' },
            { id: 'achievements', name: 'Logros', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex items-center px-8 py-4 font-medium rounded-xl transition-all duration-200 mx-2 mb-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:scale-105'
              }`}
            >
              <span className="mr-3 text-xl">{tab.icon}</span>
              <span className="text-lg font-semibold">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Conexiones Totales</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.totalConnections}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Tiempo Total</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatTime(dashboardStats.totalTime)}</p>
                  </div>
                  <div className="text-4xl">⏱️</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Tiempo Promedio</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.averageSessionTime}m</p>
                    <p className="text-purple-200 text-xs">por sesión</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Hora Favorita</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.favoriteTime}</p>
                  </div>
                  <div className="text-4xl">🕐</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  📈 Actividad Reciente
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Hoy</span>
                    </div>
                    <span className="font-bold text-white text-lg">
                      {dashboardStats.connectionsToday} conexiones
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Esta semana</span>
                    </div>
                    <span className="font-bold text-white text-lg">
                      {dashboardStats.connectionsThisWeek} conexiones
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Este mes</span>
                    </div>
                    <span className="font-bold text-white text-lg">
                      {dashboardStats.connectionsThisMonth} conexiones
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  📊 Calidad de Conexión
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-green-400 font-medium">Excelente</span>
                    </div>
                    <span className="font-bold text-white text-lg">{getQualityPercentage('excellent')}%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-yellow-400 font-medium">Buena</span>
                    </div>
                    <span className="font-bold text-white text-lg">{getQualityPercentage('good')}%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-red-400 font-medium">Mala</span>
                    </div>
                    <span className="font-bold text-white text-lg">{getQualityPercentage('poor')}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Countries and Languages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  🌍 Países Visitados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dashboardStats.countriesVisited.map((country, index) => (
                    <span key={index} className="bg-blue-600 bg-opacity-80 text-white px-3 py-2 rounded-xl text-sm font-medium border border-blue-500">
                      {country}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  🗣️ Idiomas Hablados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dashboardStats.languagesSpoken.map((language, index) => (
                    <span key={index} className="bg-green-600 bg-opacity-80 text-white px-3 py-2 rounded-xl text-sm font-medium border border-green-500">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Estadísticas Avanzadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Conexiones Hoy</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.connectionsToday}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Esta Semana</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.connectionsThisWeek}</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-pink-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">Este Mes</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{dashboardStats.connectionsThisMonth}</p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Tiempo Total</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatTime(dashboardStats.totalTime)}</p>
                  </div>
                  <div className="text-4xl">⏱️</div>
                </div>
              </div>
            </div>

            {/* Países e Idiomas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  🌍 Países Visitados
                </h3>
                <div className="space-y-3">
                  {dashboardStats.countriesVisited.map((country, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                      <span className="text-white font-medium">{country}</span>
                      <div className="ml-auto bg-blue-600 bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-medium border border-blue-500">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                  🗣️ Idiomas Hablados
                </h3>
                <div className="space-y-3">
                  {dashboardStats.languagesSpoken.map((language, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                      <span className="text-white font-medium">{language}</span>
                      <div className="ml-auto bg-green-600 bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-medium border border-green-500">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico de Actividad */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                📊 Actividad por Hora
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-700 bg-opacity-30 rounded-xl border border-gray-600">
                <div className="text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-gray-300 text-lg font-medium">Gráfico de actividad</p>
                  <p className="text-gray-400 text-sm">Próximamente</p>
                </div>
              </div>
            </div>

            {/* Métricas de Calidad */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                📊 Métricas de Calidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                  <div className="text-4xl mb-3">🟢</div>
                  <div className="text-3xl font-bold text-green-400 mb-2">{getQualityPercentage('excellent')}%</div>
                  <div className="text-gray-300 font-medium">Excelente</div>
                </div>
                <div className="text-center p-6 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                  <div className="text-4xl mb-3">🟡</div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{getQualityPercentage('good')}%</div>
                  <div className="text-gray-300 font-medium">Buena</div>
                </div>
                <div className="text-center p-6 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                  <div className="text-4xl mb-3">🔴</div>
                  <div className="text-3xl font-bold text-red-400 mb-2">{getQualityPercentage('poor')}%</div>
                  <div className="text-gray-300 font-medium">Mala</div>
                </div>
              </div>
            </div>

            {/* Métricas WebRTC Globales */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                📡 Métricas WebRTC Globales
              </h3>
              {!webrtcMetrics ? (
                <div className="text-gray-400">Cargando métricas...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['WebRTC_RTT', 'WebRTC_PacketLoss', 'WebRTC_Bitrate'].map((key) => (
                    <div key={key} className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex flex-col gap-2">
                      <div className="text-lg font-bold text-white mb-1">
                        {key === 'WebRTC_RTT' && 'RTT (ms)'}
                        {key === 'WebRTC_PacketLoss' && 'Pérdida de Paquetes'}
                        {key === 'WebRTC_Bitrate' && 'Bitrate (kbps)'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-mono text-blue-400">{webrtcMetrics[key]?.avgValue ? (key === 'WebRTC_Bitrate' ? (webrtcMetrics[key].avgValue/1000).toFixed(0) : webrtcMetrics[key].avgValue.toFixed(1)) : '-'}</span>
                        <span className="text-xs text-gray-400">{key === 'WebRTC_Bitrate' ? 'kbps' : key === 'WebRTC_RTT' ? 'ms' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-700/80 text-white">Good: {webrtcMetrics[key]?.goodCount || 0}</span>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-700/80 text-white">Poor: {webrtcMetrics[key]?.poorCount || 0}</span>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-700/80 text-white">Muestras: {webrtcMetrics[key]?.count || 0}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded mt-2 overflow-hidden">
                        <div className="h-2 bg-green-500" style={{ width: `${webrtcMetrics[key]?.goodCount && webrtcMetrics[key]?.count ? (webrtcMetrics[key].goodCount / webrtcMetrics[key].count) * 100 : 0}%` }}></div>
                        <div className="h-2 bg-red-500" style={{ width: `${webrtcMetrics[key]?.poorCount && webrtcMetrics[key]?.count ? (webrtcMetrics[key].poorCount / webrtcMetrics[key].count) * 100 : 0}%`, marginLeft: `${webrtcMetrics[key]?.goodCount && webrtcMetrics[key]?.count ? (webrtcMetrics[key].goodCount / webrtcMetrics[key].count) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-8">
            {/* Progreso General */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                🏆 Progreso General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <div className="text-2xl font-bold text-white mb-1">{dashboardStats.totalConnections}</div>
                  <div className="text-gray-300">Conexiones</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">🌍</div>
                  <div className="text-2xl font-bold text-white mb-1">{dashboardStats.countriesVisited.length}</div>
                  <div className="text-gray-300">Países</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">🗣️</div>
                  <div className="text-2xl font-bold text-white mb-1">{dashboardStats.languagesSpoken.length}</div>
                  <div className="text-gray-300">Idiomas</div>
                </div>
              </div>
            </div>

            {/* Logros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: 'Primera Conexión', 
                  icon: '🎉', 
                  unlocked: true, 
                  description: 'Completaste tu primera conexión',
                  color: 'from-green-600 to-green-700',
                  borderColor: 'border-green-500'
                },
                { 
                  title: 'Social Butterfly', 
                  icon: '🦋', 
                  unlocked: dashboardStats.totalConnections >= 10, 
                  description: '10 conexiones completadas',
                  color: 'from-blue-600 to-blue-700',
                  borderColor: 'border-blue-500'
                },
                { 
                  title: 'Viajero Mundial', 
                  icon: '🌍', 
                  unlocked: dashboardStats.countriesVisited.length >= 5, 
                  description: 'Conectaste con 5 países diferentes',
                  color: 'from-purple-600 to-purple-700',
                  borderColor: 'border-purple-500'
                },
                { 
                  title: 'Políglota', 
                  icon: '🗣️', 
                  unlocked: dashboardStats.languagesSpoken.length >= 3, 
                  description: 'Hablaste en 3 idiomas diferentes',
                  color: 'from-teal-600 to-teal-700',
                  borderColor: 'border-teal-500'
                },
                { 
                  title: 'Maratón', 
                  icon: '🏃', 
                  unlocked: dashboardStats.totalTime >= 120, 
                  description: '2 horas totales de conexión',
                  color: 'from-orange-600 to-orange-700',
                  borderColor: 'border-orange-500'
                },
                { 
                  title: 'Maestro de la Conexión', 
                  icon: '👑', 
                  unlocked: false, 
                  description: '100 conexiones completadas',
                  color: 'from-gray-600 to-gray-700',
                  borderColor: 'border-gray-500'
                }
              ].map((achievement, index) => (
                <div key={index} className={`bg-gradient-to-br ${achievement.color} rounded-2xl p-6 shadow-2xl border ${achievement.borderColor} transition-all duration-300 ${achievement.unlocked ? 'opacity-100 hover:scale-105' : 'opacity-50'}`}>
                  <div className="text-center">
                    <div className="text-5xl mb-4">{achievement.icon}</div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      {achievement.title}
                    </h4>
                    <p className="text-white text-opacity-90 mb-4">
                      {achievement.description}
                    </p>
                    {achievement.unlocked ? (
                      <div className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl text-sm font-medium border border-white border-opacity-30">
                        ✓ Desbloqueado
                      </div>
                    ) : (
                      <div className="bg-black bg-opacity-20 text-white px-4 py-2 rounded-xl text-sm font-medium border border-white border-opacity-20">
                        🔒 Bloqueado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Próximos Logros */}
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center">
                🎯 Próximos Logros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">50 Conexiones</span>
                    <span className="text-gray-400 text-sm">{dashboardStats.totalConnections}/50</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((dashboardStats.totalConnections / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-4 bg-gray-700 bg-opacity-50 rounded-xl border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">10 Países</span>
                    <span className="text-gray-400 text-sm">{dashboardStats.countriesVisited.length}/10</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((dashboardStats.countriesVisited.length / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardComponent; 