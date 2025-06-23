import React from 'react';

interface VideoEffect {
  id: string;
  name: string;
  icon: string;
}

interface VideoEffectsBarProps {
  currentEffect: string;
  setCurrentEffect: (id: string) => void;
  videoEffects: VideoEffect[];
}

const VideoEffectsBar: React.FC<VideoEffectsBarProps> = ({ currentEffect, setCurrentEffect, videoEffects }) => (
  <div className="bg-gray-900/80 p-4 rounded-2xl shadow border border-gray-700 mt-2">
    <h4 className="font-semibold mb-1 flex items-center gap-2 text-lg">✨ Efectos</h4>
    <p className="text-xs text-gray-300 mb-4">Aplica efectos visuales a tu video en tiempo real. ¡Haz clic para probarlos!</p>
    <div className="flex flex-wrap gap-4 justify-center">
      <button onClick={() => setCurrentEffect('none')} tabIndex={0} title="Quitar cualquier efecto visual" className={`px-6 py-3 rounded-xl text-base font-semibold transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${currentEffect === 'none' ? 'bg-blue-600 border-2 border-white' : 'bg-gray-700 hover:bg-gray-600'}`}>❌ Sin efecto {currentEffect === 'none' && <span className="ml-2 animate-bounce">✔️</span>}</button>
      {videoEffects.map(effect => (
        <button key={effect.id} onClick={() => setCurrentEffect(effect.id)} tabIndex={0} title={`Efecto: ${effect.name}`} className={`px-6 py-3 rounded-xl text-base font-semibold transition-colors shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${currentEffect === effect.id ? 'bg-blue-600 border-2 border-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{effect.icon} {effect.name} {currentEffect === effect.id && <span className="ml-2 animate-bounce">✔️</span>}</button>
      ))}
    </div>
  </div>
);

export default VideoEffectsBar; 