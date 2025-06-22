"use client";

import React, { useState, useEffect } from 'react';
import { useUserStats } from '../hooks/useUserStats';

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

export const UserDashboard: React.FC = () => {
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mi Dashboard
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Última actualización: {new Date().toLocaleString('es-ES')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', name: 'Resumen', icon: '📊' },
          { id: 'analytics', name: 'Analytics', icon: '📈' },
          { id: 'achievements', name: 'Logros', icon: '🏆' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DashboardTab)}
            className={`flex items-center px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Conexiones Totales"
              value={dashboardStats.totalConnections}
              icon="👥"
            />
            <StatCard
              title="Tiempo Total"
              value={formatTime(dashboardStats.totalTime)}
              icon="⏱️"
            />
            <StatCard
              title="Tiempo Promedio"
              value={`${dashboardStats.averageSessionTime}m`}
              subtitle="por sesión"
              icon="📅"
            />
            <StatCard
              title="Hora Favorita"
              value={dashboardStats.favoriteTime}
              icon="🕐"
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Hoy</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dashboardStats.connectionsToday} conexiones
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Esta semana</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dashboardStats.connectionsThisWeek} conexiones
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Este mes</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dashboardStats.connectionsThisMonth} conexiones
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Calidad de Conexión
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400">Excelente</span>
                  <span className="font-medium">{getQualityPercentage('excellent')}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">Buena</span>
                  <span className="font-medium">{getQualityPercentage('good')}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400">Mala</span>
                  <span className="font-medium">{getQualityPercentage('poor')}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Países Visitados
              </h3>
              <div className="space-y-2">
                {dashboardStats.countriesVisited.map((country, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    <span className="text-gray-700 dark:text-gray-300">{country}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Idiomas Hablados
              </h3>
              <div className="space-y-2">
                {dashboardStats.languagesSpoken.map((language, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-700 dark:text-gray-300">{language}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Actividad por Hora
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              📊 Gráfico de actividad (próximamente)
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Primera Conexión', icon: '🎉', unlocked: true, description: 'Completaste tu primera conexión' },
              { title: 'Social Butterfly', icon: '🦋', unlocked: dashboardStats.totalConnections >= 10, description: '10 conexiones completadas' },
              { title: 'Viajero Mundial', icon: '🌍', unlocked: dashboardStats.countriesVisited.length >= 5, description: 'Conectaste con 5 países diferentes' },
              { title: 'Políglota', icon: '🗣️', unlocked: dashboardStats.languagesSpoken.length >= 3, description: 'Hablaste en 3 idiomas diferentes' },
              { title: 'Maratón', icon: '🏃', unlocked: dashboardStats.totalTime >= 120, description: '2 horas totales de conexión' },
              { title: 'Maestro de la Conexión', icon: '👑', unlocked: false, description: '100 conexiones completadas' }
            ].map((achievement, index) => (
              <div key={index} className={`card p-4 text-center ${achievement.unlocked ? 'opacity-100' : 'opacity-50'}`}>
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
                {achievement.unlocked && (
                  <div className="mt-2 text-green-600 dark:text-green-400 text-sm">
                    ✓ Desbloqueado
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 