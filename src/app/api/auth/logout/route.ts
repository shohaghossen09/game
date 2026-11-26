import { NextResponse } from 'next/server';
import { stores, tokenHashOf, sessionCookieName } from '@/game/backend/store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const token = req.cookies.get(sessionCookieName)?.value;
  if (token) {
    const { auth } = await stores();
    await auth.deleteSession(tokenHashOf(token));
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, '', { path: '/', maxAge: 0 });
  return res;
}
