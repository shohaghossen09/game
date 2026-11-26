import { NextResponse } from 'next/server';
import { authStore, tokenHashOf, sessionCookieName } from '@/game/backend/store';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const token = req.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  const session = await authStore.getSession(tokenHashOf(token));
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  const user = await authStore.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, username: user.username });
}
