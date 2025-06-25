"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserDashboard from '@/components/UserDashboard';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const userData = localStorage.getItem('circleSfera_user');
    const token = localStorage.getItem('circleSfera_token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUser(user);
    } catch (error) {
      localStorage.removeItem('circleSfera_user');
      localStorage.removeItem('circleSfera_token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('circleSfera_user');
    localStorage.removeItem('circleSfera_token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff]">
        <div className="text-white text-xl font-semibold animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#1e215d] via-[#6a3093] to-[#a044ff] shadow-lg z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
            CircleSfera
          </Link>
          <span className="text-white/60 text-sm hidden sm:block">| Dashboard</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href={`/@${user?.username}`}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-full transition-all text-sm border border-white/20 shadow"
          >
            <span className="text-lg">👤</span>
            <span className="hidden sm:inline">Mi Perfil</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-full shadow transition-all text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/20 mt-8 mb-8">
          <UserDashboard />
        </div>
      </main>
    </div>
  );
} 