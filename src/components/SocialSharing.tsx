"use client";

import React, { useState } from 'react';

interface SocialSharingProps {
  isOpen: boolean;
  onClose: () => void;
  shareData?: {
    title: string;
    description: string;
    url: string;
    image?: string;
  };
}

interface SharePlatform {
  name: string;
  icon: string;
  color: string;
  url: string;
  method: 'native' | 'url' | 'clipboard';
}

export const SocialSharing: React.FC<SocialSharingProps> = ({ 
  isOpen, onClose, shareData 
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const defaultShareData = {
    title: 'CircleSfera - Conecta con el Mundo',
    description: '¡Únete a CircleSfera y conoce personas increíbles de todo el mundo!',
    url: 'https://circlesfera.vercel.app',
    image: '/og-image.jpg'
  };

  const data = shareData || defaultShareData;

  const platforms: SharePlatform[] = [
    {
      name: 'WhatsApp',
      icon: '📱',
      color: '#25D366',
      url: `https://wa.me/?text=${encodeURIComponent(`${data.title}\n\n${data.description}\n\n${data.url}`)}`,
      method: 'url'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: '#0088cc',
      url: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.description)}`,
      method: 'url'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.description)}&url=${encodeURIComponent(data.url)}`,
      method: 'url'
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
      method: 'url'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: '#0A66C2',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
      method: 'url'
    },
    {
      name: 'Email',
      icon: '📧',
      color: '#EA4335',
      url: `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.description}\n\n${data.url}`)}`,
      method: 'url'
    }
  ];

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const openShareUrl = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Compartir CircleSfera
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Native Share */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <div className="text-center">
              <button
                onClick={shareNative}
                className="btn-primary w-full"
              >
                📤 Compartir con Apps del Sistema
              </button>
            </div>
          )}

          {/* Social Platforms */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Redes Sociales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => openShareUrl(platform.url)}
                  className="flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:scale-105"
                  style={{ borderColor: platform.color + '20' }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{platform.icon}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {platform.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Código de Invitación
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inviteCode}
                  readOnly
                  placeholder="Genera un código de invitación"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={generateInviteCode}
                  className="btn-secondary whitespace-nowrap"
                >
                  Generar
                </button>
              </div>
              {inviteCode && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(inviteCode, 'code')}
                    className="btn-primary flex-1"
                  >
                    {copiedPlatform === 'code' ? '✓ Copiado' : '📋 Copiar Código'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(`${data.url}?ref=${inviteCode}`, 'link')}
                    className="btn-secondary flex-1"
                  >
                    {copiedPlatform === 'link' ? '✓ Copiado' : '🔗 Copiar Enlace'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Código QR
              </h3>
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showQR ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {showQR && (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    📱 QR Code
                    <br />
                    <span className="text-sm">(próximamente)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Escanea para acceder directamente a CircleSfera
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Estadísticas de Compartir
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compartido</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Clicks</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Registros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}; 