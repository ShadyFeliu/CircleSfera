"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
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
      {/* Botón flotante de acceso a la guía de estilos */}
      <a
        href="/styleguide"
        target="_self"
        className="fixed z-50 bottom-6 left-6 md:left-auto md:right-6 bg-gradient-to-r from-[#1e215d] via-[#6a3093] to-[#a044ff] text-white font-bold px-4 py-2 md:px-5 md:py-3 rounded-xl shadow-2xl opacity-90 hover:opacity-100 transition-all duration-200 hover:scale-105 text-xs md:text-base border border-white/20 backdrop-blur-sm"
        style={{ textDecoration: "none" }}
      >
        🎨 Guía de Estilos
      </a>
    </>
  );
} 