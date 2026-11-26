import { NextResponse } from 'next/server';
import { authStore, tokenHashOf, sessionCookieName } from '@/game/backend/store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const token = req.cookies.get(sessionCookieName)?.value;
  if (token) {
    await authStore.deleteSession(tokenHashOf(token));
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, '', { path: '/', maxAge: 0 });
  return res;
}
