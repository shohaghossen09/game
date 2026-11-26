import { NextResponse } from 'next/server';
import { stores, tokenHashOf, sessionCookieName } from '@/game/backend/store';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const token = req.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  const { auth } = await stores();
  const session = await auth.getSession(tokenHashOf(token));
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  const user = await auth.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, username: user.username });
}
