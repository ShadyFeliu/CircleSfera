import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register'];
  
  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/chat'];
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Verificar si es una ruta pública de autenticación
  const isAuthRoute = publicRoutes.includes(pathname);
  
  // Obtener token del localStorage (esto se maneja en el cliente)
  // Para el middleware, verificamos si hay cookies de sesión
  const hasAuthCookie = request.cookies.has('circleSfera_token');
  
  // Si es una ruta protegida y no está autenticado, redirigir a login
  if (isProtectedRoute && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si está en una ruta de auth y ya está autenticado, redirigir a dashboard
  if (isAuthRoute && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Para la página principal, verificar autenticación
  if (pathname === '/' && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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