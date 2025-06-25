import { NextRequest, NextResponse } from 'next/server';

// Utilidad para limpiar el username (quitar @ si viene en la URL)
function cleanUsername(username: string) {
  return username.startsWith('@') ? username.slice(1) : username;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = cleanUsername(params.username);
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace('/socket.io', '') || 'https://api.circlesfera.com';

  try {
    const res = await fetch(`${backendUrl}/api/user/${username}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.error || 'Usuario no encontrado' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar el usuario' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = cleanUsername(params.username);
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace('/socket.io', '') || 'https://api.circlesfera.com';
  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/user/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.error || 'Error al actualizar el usuario' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
} 