"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();

  // Limpiar errores cuando cambia el método de login
  useEffect(() => {
    setError('');
    setFieldErrors({});
  }, [loginMethod]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (loginMethod === 'email') {
      if (!formData.email) {
        errors.email = 'El email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Formato de email inválido';
      }
    } else {
      if (!formData.username) {
        errors.username = 'El nombre de usuario es requerido';
      } else if (formData.username.length < 3) {
        errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      }
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        password: formData.password,
        ...(loginMethod === 'email' ? { email: formData.email } : { username: formData.username })
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('¡Inicio de sesión exitoso!');
        localStorage.setItem('circleSfera_user', JSON.stringify(data.user));
        localStorage.setItem('circleSfera_token', data.token);
        
        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1e215d] via-[#6a3093] to-[#a044ff] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 flex flex-col gap-6">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">CircleSfera</h1>
          <p className="text-white/70 text-base">Conecta con el mundo</p>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Iniciar Sesión</h2>
        
        {/* Método de login */}
        <div className="flex bg-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              loginMethod === 'email'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('username')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              loginMethod === 'username'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Usuario
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded-lg text-center animate-pulse">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500 bg-opacity-20 border border-green-400 text-green-200 px-4 py-3 rounded-lg text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {loginMethod === 'email' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all ${
                  fieldErrors.email ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="tu@email.com"
              />
              {fieldErrors.email && (
                <p className="text-red-300 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all ${
                  fieldErrors.username ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="usuario123"
              />
              {fieldErrors.username && (
                <p className="text-red-300 text-sm mt-1">{fieldErrors.username}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all ${
                fieldErrors.password ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-red-300 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6a3093] to-[#a044ff] hover:from-[#a044ff] hover:to-[#6a3093] text-white font-bold py-3 rounded-2xl text-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-white/70 text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-white/50 text-xs">
          <p>Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.</p>
        </div>
      </div>
    </div>
  );
} 