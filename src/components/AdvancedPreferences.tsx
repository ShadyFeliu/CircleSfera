"use client";

import React, { useState, useEffect } from 'react';

interface UserPreferences {
  language: string[];
  country: string[];
  ageRange: {
    min: number;
    max: number;
  };
  interests: string[];
  gender: 'any' | 'male' | 'female' | 'other';
  connectionType: 'video' | 'audio' | 'both';
  timezone: string;
  notificationSettings: {
    newMatches: boolean;
    connectionQuality: boolean;
    achievements: boolean;
  };
}

interface AdvancedPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: UserPreferences) => void;
}

type TabType = 'basic' | 'advanced' | 'notifications';
type GenderType = 'any' | 'male' | 'female' | 'other';
type ConnectionType = 'video' | 'audio' | 'both';

const LANGUAGES = [
  'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 
  'Ruso', 'Chino', 'Japonés', 'Coreano', 'Árabe', 'Hindi'
];

const COUNTRIES = [
  'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
  'Estados Unidos', 'Canadá', 'Reino Unido', 'Francia', 'Alemania', 'Italia',
  'Brasil', 'Portugal', 'Rusia', 'China', 'Japón', 'Corea del Sur', 'India'
];

const INTERESTS = [
  'Música', 'Deportes', 'Cine', 'Literatura', 'Tecnología', 'Cocina',
  'Viajes', 'Arte', 'Fotografía', 'Videojuegos', 'Fitness', 'Meditación',
  'Política', 'Ciencia', 'Historia', 'Filosofía', 'Mascotas', 'Jardinería',
  'Moda', 'Automóviles', 'Astronomía', 'Arqueología', 'Psicología'
];

export const AdvancedPreferences: React.FC<AdvancedPreferencesProps> = ({ 
  isOpen, onClose, onSave 
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: ['Español'],
    country: [],
    ageRange: { min: 18, max: 65 },
    interests: [],
    gender: 'any',
    connectionType: 'both',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notificationSettings: {
      newMatches: true,
      connectionQuality: true,
      achievements: true
    }
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'notifications'>('basic');

  useEffect(() => {
    // Cargar preferencias guardadas
    const saved = localStorage.getItem('circlesfera_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('circlesfera_preferences', JSON.stringify(preferences));
    onSave(preferences);
    onClose();
  };

  const toggleLanguage = (lang: string) => {
    setPreferences(prev => ({
      ...prev,
      language: prev.language.includes(lang)
        ? prev.language.filter(l => l !== lang)
        : [...prev.language, lang]
    }));
  };

  const toggleCountry = (country: string) => {
    setPreferences(prev => ({
      ...prev,
      country: prev.country.includes(country)
        ? prev.country.filter(c => c !== country)
        : [...prev.country, country]
    }));
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Preferencias Avanzadas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'basic', name: 'Básicas', icon: '⚙️' },
            { id: 'advanced', name: 'Avanzadas', icon: '🎯' },
            { id: 'notifications', name: 'Notificaciones', icon: '🔔' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Language */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Idiomas Preferidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`p-2 rounded-lg border transition-all ${
                        preferences.language.includes(lang)
                          ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Rango de Edad
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Mínimo: {preferences.ageRange.min}
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="80"
                      value={preferences.ageRange.min}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        ageRange: { ...prev.ageRange, min: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Máximo: {preferences.ageRange.max}
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="80"
                      value={preferences.ageRange.max}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        ageRange: { ...prev.ageRange, max: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Género Preferido
                </h3>
                <div className="flex space-x-4">
                  {[
                    { value: 'any', label: 'Cualquiera' },
                    { value: 'male', label: 'Masculino' },
                    { value: 'female', label: 'Femenino' },
                    { value: 'other', label: 'Otro' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={preferences.gender === option.value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          gender: e.target.value as GenderType
                        }))}
                        className="mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Countries */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Países Preferidos (opcional)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country}
                      onClick={() => toggleCountry(country)}
                      className={`p-2 rounded-lg border transition-all ${
                        preferences.country.includes(country)
                          ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-400 dark:text-green-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Intereses (máximo 5)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      disabled={!preferences.interests.includes(interest) && preferences.interests.length >= 5}
                      className={`p-2 rounded-lg border transition-all ${
                        preferences.interests.includes(interest)
                          ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-400 dark:text-purple-300'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      } ${!preferences.interests.includes(interest) && preferences.interests.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Connection Type */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Tipo de Conexión
                </h3>
                <div className="flex space-x-4">
                  {[
                    { value: 'both', label: 'Video y Audio', icon: '🎥🎤' },
                    { value: 'video', label: 'Solo Video', icon: '🎥' },
                    { value: 'audio', label: 'Solo Audio', icon: '🎤' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="connectionType"
                        value={option.value}
                        checked={preferences.connectionType === option.value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          connectionType: e.target.value as ConnectionType
                        }))}
                        className="mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {option.icon} {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Configuración de Notificaciones
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'newMatches', label: 'Nuevos emparejamientos', description: 'Recibe notificaciones cuando encuentres nuevas personas' },
                    { key: 'connectionQuality', label: 'Calidad de conexión', description: 'Alertas sobre problemas de conexión' },
                    { key: 'achievements', label: 'Logros desbloqueados', description: 'Celebra cuando desbloquees nuevos logros' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{setting.label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notificationSettings[setting.key as keyof typeof preferences.notificationSettings]}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            notificationSettings: {
                              ...prev.notificationSettings,
                              [setting.key]: e.target.checked
                            }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
}; 