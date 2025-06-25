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
    <header className="w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 shadow-lg z-40">
      <Link href="/" className="text-2xl md:text-3xl font-bold text-white tracking-tight">
        CircleSfera
      </Link>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base border border-white border-opacity-20"
            >
              <span className="text-lg md:text-xl">📊</span>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            {username && (
              <Link
                href={`/@${username}`}
                className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base border border-white border-opacity-20"
              >
                <span className="text-lg md:text-xl">👤</span>
                <span className="hidden sm:inline">Mi Perfil</span>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-white hover:text-blue-300 font-semibold transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 