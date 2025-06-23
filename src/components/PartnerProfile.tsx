import React from 'react';
import Image from 'next/image';

export type PartnerProfileData = {
  alias?: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  languages?: string[];
  age?: number;
  gender?: string;
  interests?: string[];
  stats?: {
    totalChats?: number;
    achievements?: string[];
    ranking?: number;
  };
  badges?: string[];
  connectionQuality?: 'excellent' | 'good' | 'poor';
  isVerified?: boolean;
};

interface PartnerProfileProps {
  profile: PartnerProfileData;
}

const badgeIcons: Record<string, string> = {
  'veterano': '🏅',
  'popular': '🔥',
  'explorador': '🌍',
  'amable': '🤗',
  'estrella': '⭐',
  'verificado': '✅',
};

export const PartnerProfile: React.FC<PartnerProfileProps> = ({ profile }) => {
  return (
    <div className="w-full max-w-xs bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700 text-white flex flex-col items-center gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg bg-gray-700">
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="Avatar" width={112} height={112} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-800">👤</div>
          )}
        </div>
        {profile.isVerified && (
          <span className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full px-2 py-1 text-xs font-bold border-2 border-white shadow">✅</span>
        )}
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold flex items-center justify-center gap-2">
          {profile.alias || 'Anónimo'}
          {profile.badges?.includes('verificado') && <span title="Verificado">✅</span>}
        </div>
        <div className="text-sm text-gray-300 mt-1">
          {profile.age && <span>{profile.age} años</span>}
          {profile.gender && <span> • {profile.gender}</span>}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {profile.city && <span>{profile.city}, </span>}
          {profile.country}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {profile.languages?.map(lang => (
          <span key={lang} className="bg-blue-700 px-2 py-1 rounded text-xs font-medium">{lang}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {profile.interests?.slice(0, 5).map(interest => (
          <span key={interest} className="bg-green-700 px-2 py-1 rounded text-xs font-medium">#{interest}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {profile.badges?.map(badge => (
          <span key={badge} className="bg-yellow-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            {badgeIcons[badge] || '🏆'} {badge}
          </span>
        ))}
      </div>
      <div className="w-full flex flex-col gap-1 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Chats</span>
          <span className="font-bold">{profile.stats?.totalChats ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Ranking</span>
          <span className="font-bold">{profile.stats?.ranking ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Conexión</span>
          <span className={`font-bold ${profile.connectionQuality === 'excellent' ? 'text-green-400' : profile.connectionQuality === 'good' ? 'text-yellow-400' : 'text-red-400'}`}>{profile.connectionQuality ? (profile.connectionQuality === 'excellent' ? 'Excelente' : profile.connectionQuality === 'good' ? 'Buena' : 'Mala') : '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfile; 