import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend para autenticación
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace('/socket.io', '') || 'https://api.circlesfera.com';
    
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error de autenticación' },
        { status: response.status }
      );
    }

    // Devolver datos del usuario y token
    return NextResponse.json({
      user: data.user,
      token: data.token,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en login API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 