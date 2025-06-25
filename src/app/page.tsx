"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatRoom from "@/components/ChatRoom";
import { useTheme } from "@/components/ThemeProvider";
import Header from '@/components/Header';

export default function Home() {
  console.log('🏠 Home component iniciando...');
  
  const [interests, setInterests] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { toggleTheme, colorScheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  console.log('🔍 Estado actual - showChat:', showChat, 'interests:', interests, 'ageFilter:', ageFilter);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const userData = localStorage.getItem('circleSfera_user');
    const token = localStorage.getItem('circleSfera_token');

    if (userData && token) {
      setIsAuthenticated(true);
      // Si está autenticado, redirigir al dashboard
      router.push('/dashboard');
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [router]);

  const handleStartChat = () => {
    if (!isAuthenticated) {
      // Si no está autenticado, redirigir a login
      router.push('/login');
      return;
    }
    
    console.log('🚀 handleStartChat ejecutado');
    setShowChat(true);
  };

  const handleBackToHome = () => {
    setShowChat(false);
    setInterests("");
    setAgeFilter("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff]">
        <div className="text-white text-xl font-semibold animate-pulse">Cargando...</div>
      </div>
    );
  }

  // Si está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff]">
        <div className="text-white text-xl font-semibold animate-pulse">Redirigiendo...</div>
      </div>
    );
  }

  if (showChat) {
    console.log('🎬 Renderizando ChatRoom porque showChat es true');
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center relative pt-16 sm:pt-20">
        <button
          onClick={handleBackToHome}
          className="absolute top-8 left-2 sm:top-12 sm:left-8 z-50 bg-gray-800/80 hover:bg-gray-700 text-white px-5 py-2 rounded-full transition-all shadow-lg border border-gray-600 text-base font-semibold opacity-80 hover:opacity-100 backdrop-blur"
        >
          ← Volver
        </button>
        <ChatRoom interests={interests} ageFilter={ageFilter} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight">CircleSfera</h1>
          <p className="text-lg sm:text-2xl text-white/80 font-medium mb-2">Conecta con personas de todo el mundo a través de video chat.</p>
          <p className="text-base sm:text-lg text-white/60 mb-0">Descubre nuevas culturas, haz amigos y expande tus horizontes.</p>
        </div>
        <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white mb-2">Comienza tu aventura</h2>
          <div className="flex flex-col gap-4">
            <div className="text-left">
              <label htmlFor="interests" className="block text-sm font-medium text-white/80 mb-1">¿Qué te interesa? <span className="text-xs text-white/50">(opcional)</span></label>
              <input
                id="interests"
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Ej: música, tecnología, viajes, deportes..."
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all"
              />
              <p className="text-xs text-white/50 mt-1">Ayuda a encontrar personas con intereses similares</p>
            </div>
            <div className="text-left">
              <label htmlFor="ageFilter" className="block text-sm font-medium text-white/80 mb-1">Filtro de edad <span className="text-xs text-white/50">(opcional)</span></label>
              <select
                id="ageFilter"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all"
              >
                <option value="">Cualquier edad</option>
                <option value="18-25">18-25 años</option>
                <option value="26-35">26-35 años</option>
                <option value="36-45">36-45 años</option>
                <option value="46+">46+ años</option>
              </select>
            </div>
            <button
              onClick={handleStartChat}
              className="w-full bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white font-bold py-3 rounded-2xl text-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 mt-2"
            >
              🚀 Comenzar Chat
            </button>
          </div>
        </div>
        <div className="text-center text-white/70 text-xs sm:text-sm mt-8">
          <p>Al hacer clic en &quot;Comenzar Chat&quot;, aceptas nuestros términos de servicio y política de privacidad.</p>
          <p className="mt-2">
            <span className="text-green-400">✓</span> Conexiones seguras
            <span className="mx-1 sm:mx-2">•</span>
            <span className="text-green-400">✓</span> Registro requerido
            <span className="mx-1 sm:mx-2">•</span>
            <span className="text-green-400">✓</span> Totalmente gratuito
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">Iniciar Sesión</Link>
            <Link href="/register" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">Registrarse</Link>
          </div>
        </div>
      </main>
    </div>
  );
} 