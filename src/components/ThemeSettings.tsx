"use client";

import React, { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeTab = 'theme' | 'colors';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'colors'>('theme');

  if (!isOpen) return null;

  const themes = [
    { id: 'light', name: 'Claro', icon: '☀️' },
    { id: 'dark', name: 'Oscuro', icon: '🌙' },
    { id: 'auto', name: 'Automático', icon: '🔄' }
  ];

  const colors = [
    { id: 'blue', name: 'Azul', class: 'bg-blue-500' },
    { id: 'purple', name: 'Púrpura', class: 'bg-purple-500' },
    { id: 'green', name: 'Verde', class: 'bg-green-500' },
    { id: 'orange', name: 'Naranja', class: 'bg-orange-500' },
    { id: 'pink', name: 'Rosa', class: 'bg-pink-500' },
    { id: 'red', name: 'Rojo', class: 'bg-red-500' }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Personalización
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'theme'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Tema
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'colors'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Colores
          </button>
        </div>

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Modo de Tema
            </h3>
            <div className="grid gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as typeof theme)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                    theme === t.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl mr-3">{t.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t.name}
                  </span>
                  {theme === t.id && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Esquema de Color
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColorScheme(c.id as ColorScheme)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                    colorScheme === c.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${c.class} mr-3`}></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {c.name}
                  </span>
                  {colorScheme === c.id && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}; 