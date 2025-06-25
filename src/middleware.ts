import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/'];
  
  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard'];
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Para rutas protegidas, permitir que el frontend maneje la autenticación
  // El middleware no puede acceder a localStorage, así que confiamos en el cliente
  if (isProtectedRoute) {
    // Permitir que el componente del cliente verifique la autenticación
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 