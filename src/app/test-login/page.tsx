"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const [formData, setFormData] = useState({
    email: 'test@test.com',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    console.log('🧪 Iniciando prueba de login...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📦 Resultado completo:', data);

      if (response.ok) {
        // Guardar datos
        localStorage.setItem('circleSfera_user', JSON.stringify(data.user));
        localStorage.setItem('circleSfera_token', data.token);
        
        setResult({
          success: true,
          message: 'Login exitoso',
          data: data
        });
        
        // Redirigir después de 2 segundos para ver el resultado
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error,
          data: data
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Error de conexión',
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">🧪 Test Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-white/80 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6a3093] to-[#a044ff] text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Probando...' : 'Probar Login'}
          </button>
        </form>

        {result && (
          <div className={`p-4 rounded-xl ${result.success ? 'bg-green-500/20 border border-green-400' : 'bg-red-500/20 border border-red-400'}`}>
            <h3 className={`font-bold mb-2 ${result.success ? 'text-green-200' : 'text-red-200'}`}>
              {result.success ? '✅ Éxito' : '❌ Error'}
            </h3>
            <p className="text-white/80 mb-2">{result.message}</p>
            {result.data && (
              <details className="text-xs text-white/60">
                <summary>Ver datos completos</summary>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 