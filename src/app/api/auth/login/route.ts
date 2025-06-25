import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    // Validar que se proporcione email o username
    if (!email && !username) {
      return NextResponse.json(
        { error: 'Debes proporcionar email o nombre de usuario' },
        { status: 400 }
      );
    }

    // Validar contraseña
    if (!password) {
      return NextResponse.json(
        { error: 'La contraseña es requerida' },
        { status: 400 }
      );
    }

    // Validar formato de email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Formato de email inválido' },
          { status: 400 }
        );
      }
    }

    // Llamar al backend para autenticación
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace('/socket.io', '') || 'https://api.circlesfera.com';
    
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
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