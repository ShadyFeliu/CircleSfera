import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, nombre } = await request.json();

    // Validar campos requeridos
    if (!username || !email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar longitud de username
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Llamar al backend para registro
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace('/socket.io', '') || 'https://api.circlesfera.com';
    
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        email, 
        password, 
        nombre,
        alias: username // Usar username como alias
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error en el registro' },
        { status: response.status }
      );
    }

    // Devolver datos del usuario y token
    return NextResponse.json({
      user: data.user,
      token: data.token,
      message: 'Registro exitoso'
    });

  } catch (error) {
    console.error('Error en register API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 