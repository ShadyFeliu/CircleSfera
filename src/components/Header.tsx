"use client";

import { useEffect, useState } from 'react';

export default function Header() {
  const [username, setUsername] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('circleSfera_user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || null);
        } catch {
          setUsername(null);
        }
      }
    }
  }, []);

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 shadow-lg z-40">
      <a href="/" className="text-2xl md:text-3xl font-bold text-white tracking-tight">CircleSfera</a>
      {username && (
        <a
          href={`/@${username}`}
          className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold px-4 py-2 md:px-6 md:py-2 rounded-full shadow transition-all text-sm md:text-base border border-white border-opacity-20"
          style={{textDecoration: 'none'}}
        >
          <span className="text-lg md:text-xl">👤</span>
          <span className="hidden sm:inline">Mi Perfil</span>
        </a>
      )}
    </header>
  );
} 