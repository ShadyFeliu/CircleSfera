"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", username: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/user/${params.username}`);
        if (!res.ok) throw new Error("Usuario no encontrado");
        const data = await res.json();
        setUser(data);
        setForm({
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          username: data.username || params.username,
        });
      } catch (err: any) {
        setError(err.message || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [params.username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/user/${params.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el perfil");
      const data = await res.json();
      setUser(data);
      setEditMode(false);
      setSuccess("Perfil actualizado correctamente");
    } catch (err: any) {
      setError(err.message || "Error al guardar los cambios");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white p-6">
      <div className="card w-full max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Perfil de @{user?.username || params.username}</h1>
        {error && <div className="bg-red-600 text-white p-2 rounded mb-4 text-center">{error}</div>}
        {success && <div className="bg-green-600 text-white p-2 rounded mb-4 text-center">{success}</div>}
        {editMode ? (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block mb-1">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div>
              <label className="block mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div>
              <label className="block mb-1">Nombre de usuario</label>
              <input name="username" value={form.username} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary w-full">Guardar</button>
              <button type="button" className="btn-secondary w-full" onClick={() => setEditMode(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div><span className="font-semibold">Nombre:</span> {user.nombre}</div>
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">Teléfono:</span> {user.telefono}</div>
            <div><span className="font-semibold">Nombre de usuario:</span> @{user.username}</div>
            <button className="btn-primary w-full mt-6" onClick={() => setEditMode(true)}>Editar perfil</button>
          </div>
        )}
      </div>
    </div>
  );
} 