"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";

interface User {
  nombre: string;
  email: string;
  telefono: string;
  username: string;
  avatarUrl?: string;
}

interface UserProfileClientProps {
  username: string;
}

export default function UserProfileClient({ username }: UserProfileClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", username: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key:string]: string}>({});
  const router = useRouter();

  const actualUsername = username.startsWith('@') ? username.slice(1) : username;

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/user/${actualUsername}`);
        if (res.status === 404) {
          setError("Usuario no encontrado");
          setUser(null);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          let data = {};
          try { data = await res.json(); } catch {}
          setError((data as any).error || "Error al cargar el perfil");
          setUser(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data);
        setForm({
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          username: data.username || actualUsername,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar el perfil";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [actualUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors: {[key:string]: string} = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido';
    if (!form.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Formato de email inválido';
    }
    if (form.telefono && !/^[+\d\s-]{7,20}$/.test(form.telefono)) {
      errors.telefono = 'Formato de teléfono inválido';
    }
    if (!form.username) errors.username = 'El nombre de usuario es requerido';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/user/${actualUsername}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 404) {
        setError("Usuario no encontrado");
        setSaving(false);
        return;
      }
      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        if ((data as any).error && (data as any).error.includes("ya está en uso")) {
          if ((data as any).error.includes("usuario")) setFieldErrors(e => ({...e, username: "Ese nombre de usuario ya está en uso."}));
          if ((data as any).error.includes("email")) setFieldErrors(e => ({...e, email: "Ese email ya está en uso."}));
          setError(null);
        } else if ((data as any).error && (data as any).error.includes("Formato de email")) {
          setFieldErrors(e => ({...e, email: "Formato de email inválido."}));
          setError(null);
        } else if ((data as any).error && (data as any).error.includes("teléfono")) {
          setFieldErrors(e => ({...e, telefono: "Formato de teléfono inválido."}));
          setError(null);
        } else {
          setError((data as any).error || "Error al guardar los cambios");
        }
        setSaving(false);
        return;
      }
      const data = await res.json();
      setUser(data);
      setEditMode(false);
      setSuccess("Perfil actualizado correctamente");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar los cambios";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleBackToProfile = () => {
    setShowChat(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff]"><div className="text-white text-xl font-semibold animate-pulse">Cargando perfil...</div></div>;

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] flex flex-col items-center justify-center relative pt-16 sm:pt-20">
        <button
          onClick={handleBackToProfile}
          className="absolute top-8 left-2 sm:top-12 sm:left-8 z-50 bg-gray-800/80 hover:bg-gray-700 text-white px-5 py-2 rounded-full transition-all shadow-lg border border-gray-600 text-base font-semibold opacity-80 hover:opacity-100 backdrop-blur"
        >
          ← Volver al perfil
        </button>
        <ChatRoom interests="" ageFilter="" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] p-6">
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 flex flex-col items-center gap-6">
        {/* Avatar grande */}
        <div className="flex flex-col items-center gap-2">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6a3093] to-[#a044ff] flex items-center justify-center text-5xl text-white shadow-lg border-4 border-white">
              <span>👤</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mt-2">@{user?.username || actualUsername}</h1>
        </div>
        {error && <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-center w-full">{error}</div>}
        {success && <div className="bg-green-600 bg-opacity-20 border border-green-400 text-green-200 px-4 py-3 rounded-lg text-center w-full">{success}</div>}
        {editMode ? (
          <form className="space-y-4 w-full" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block mb-1 text-white/80">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className={`w-full p-2 rounded-xl bg-white/20 border ${fieldErrors.nombre ? 'border-red-400' : 'border-white/30'} text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent`} />
              {fieldErrors.nombre && <p className="text-red-300 text-sm mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block mb-1 text-white/80">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className={`w-full p-2 rounded-xl bg-white/20 border ${fieldErrors.email ? 'border-red-400' : 'border-white/30'} text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent`} />
              {fieldErrors.email && <p className="text-red-300 text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block mb-1 text-white/80">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className={`w-full p-2 rounded-xl bg-white/20 border ${fieldErrors.telefono ? 'border-red-400' : 'border-white/30'} text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent`} />
              {fieldErrors.telefono && <p className="text-red-300 text-sm mt-1">{fieldErrors.telefono}</p>}
            </div>
            <div>
              <label className="block mb-1 text-white/80">Nombre de usuario</label>
              <input name="username" value={form.username} onChange={handleChange} className={`w-full p-2 rounded-xl bg-white/20 border ${fieldErrors.username ? 'border-red-400' : 'border-white/30'} text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent`} />
              {fieldErrors.username && <p className="text-red-300 text-sm mt-1">{fieldErrors.username}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white font-bold py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60 disabled:cursor-not-allowed">Guardar</button>
              <button type="button" className="w-full bg-gray-700/80 hover:bg-gray-800 text-white font-bold py-2 rounded-xl shadow-lg border border-gray-600 transition-all" onClick={() => setEditMode(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg text-white/80 font-semibold">Nombre:</span>
              <span className="text-xl text-white font-bold">{user?.nombre}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg text-white/80 font-semibold">Email:</span>
              <span className="text-xl text-white font-bold">{user?.email}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg text-white/80 font-semibold">Teléfono:</span>
              <span className="text-xl text-white font-bold">{user?.telefono}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg text-white/80 font-semibold">Nombre de usuario:</span>
              <span className="text-xl text-white font-bold">@{user?.username}</span>
            </div>
            <div className="flex gap-2 mt-6">
              <button className="w-full bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white font-bold py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400" onClick={() => setEditMode(true)}>Editar perfil</button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleStartChat}>🚀 Iniciar Chat</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 