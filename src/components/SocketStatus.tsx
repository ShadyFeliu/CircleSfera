"use client";

import { useSocket } from "@/hooks/useSocket";

export default function SocketStatus() {
  const { status: socketStatus, retries } = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

  let color = "text-gray-400";
  let text = "Desconectado";
  if (socketStatus === "connected") { color = "text-green-500"; text = "Conectado"; }
  else if (socketStatus === "reconnecting") { color = "text-yellow-500"; text = `Reconectando (${retries})...`; }
  else if (socketStatus === "failed") { color = "text-red-500"; text = "Fallo de conexión"; }

  return (
    <div className={`fixed top-2 right-2 z-[100] px-3 py-1 rounded shadow bg-white/80 dark:bg-gray-900/80 ${color} text-sm font-semibold transition-all pointer-events-none`}>
      <span className="mr-2">●</span>{text}
    </div>
  );
} 