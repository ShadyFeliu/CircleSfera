"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Validar fortaleza de contraseña
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 6) strength++;
      if (/[A-Z]/.test(formData.password)) strength++;
      if (/[a-z]/.test(formData.password)) strength++;
      if (/[0-9]/.test(formData.password)) strength++;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

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
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar username
    if (!formData.username) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }
    
    // Validar email
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }
    
    // Validar contraseña
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Muy débil';
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength <= 3) return 'Media';
    if (passwordStrength <= 4) return 'Fuerte';
    return 'Muy fuerte';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('¡Cuenta creada exitosamente!');
        localStorage.setItem('circleSfera_user', JSON.stringify(data.user));
        localStorage.setItem('circleSfera_token', data.token);
        
        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Error al registrarse');
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
          <p className="text-white/70 text-base">Únete a la comunidad</p>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Crear Cuenta</h2>
        
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
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-white/80 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all ${
                fieldErrors.nombre ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="Tu nombre completo"
            />
            {fieldErrors.nombre && (
              <p className="text-red-300 text-sm mt-1">{fieldErrors.nombre}</p>
            )}
          </div>

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
            <p className="text-xs text-white/50 mt-1">Mínimo 3 caracteres, solo letras, números y guiones bajos</p>
            {fieldErrors.username && (
              <p className="text-red-300 text-sm mt-1">{fieldErrors.username}</p>
            )}
          </div>

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
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-white/70">{getPasswordStrengthText()}</span>
                </div>
                <p className="text-xs text-white/50">Mínimo 6 caracteres</p>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-red-300 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-white/20 border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-base transition-all ${
                fieldErrors.confirmPassword ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-300 text-sm mt-1">{fieldErrors.confirmPassword}</p>
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
                Creando cuenta...
              </span>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-white/70 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-white/50 text-xs">
          <p>Al registrarte, aceptas nuestros términos de servicio y política de privacidad.</p>
        </div>
      </div>
    </div>
  );
} 