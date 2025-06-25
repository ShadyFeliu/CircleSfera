"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('circleSfera_user');
      const token = localStorage.getItem('circleSfera_token');
      
      if (userData && token) {
        try {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || null);
          setIsAuthenticated(true);
        } catch {
          setUsername(null);
          setIsAuthenticated(false);
        }
      } else {
        setUsername(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('circleSfera_user');
    localStorage.removeItem('circleSfera_token');
    setUsername(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 md:px-8 md:py-5 bg-gradient-to-r from-[#1e215d] via-[#6a3093] to-[#a044ff] shadow-2xl border-b border-white/10 backdrop-blur-lg z-50">
      <Link href="/" className="text-2xl md:text-3xl font-bold text-white tracking-tight hover:text-purple-200 transition-colors duration-200">
        🌟 CircleSfera
      </Link>
      
      <div className="flex items-center gap-3 md:gap-4">
        {isAuthenticated ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm md:text-base border border-white/20 backdrop-blur-sm"
            >
              <span className="text-lg md:text-xl">📊</span>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            {username && (
              <Link
                href={`/@${username}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm md:text-base border border-white/20 backdrop-blur-sm"
              >
                <span className="text-lg md:text-xl">👤</span>
                <span className="hidden sm:inline">Mi Perfil</span>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-red-600/80 hover:bg-red-700 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm md:text-base border border-red-500/30 backdrop-blur-sm"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/login"
              className="text-white/90 hover:text-white font-semibold transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 text-sm md:text-base border border-white/20"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 