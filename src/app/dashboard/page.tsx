"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/20 mt-8 mb-8">
          <UserDashboard />
        </div>
      </main>
    </div>
  );
} 