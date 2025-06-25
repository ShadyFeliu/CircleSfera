"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import SocketStatus from "@/components/SocketStatus";
import { useErrorMonitoring } from "@/hooks/useErrorMonitoring";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  
  // Initialize error monitoring
  useErrorMonitoring();
  
  return (
    <>
      {!isLanding && <Header />}
      {children}
      {!isLanding && <SocketStatus />}
      {/* Botón flotante de acceso a la guía de estilos */}
      <a
        href="/styleguide"
        target="_self"
        className="fixed z-50 bottom-6 left-6 md:left-auto md:right-6 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white font-bold px-4 py-2 md:px-5 md:py-3 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-all text-xs md:text-base"
        style={{ textDecoration: "none" }}
      >
        🎨 Guía de Estilos
      </a>
    </>
  );
} 