import { NextResponse } from 'next/server';
import {
  stores, loginLimiter,
  verifyPassword, newSessionToken, tokenHashOf, sessionExpiry
} from '@/game/backend/store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!loginLimiter(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const { username, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Missing credentials.' }, { status: 400 });
  }

  const { auth } = await stores();
  const user = await auth.getUserByName(username);
  // same error for unknown user and wrong password (no account enumeration)
  if (!user || !verifyPassword(password, user.passHash)) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const token = newSessionToken();
  await auth.putSession({
    tokenHash: tokenHashOf(token),
    userId: user.id,
    expiresAt: sessionExpiry()
  });

  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set('bls_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 14 * 24 * 60 * 60
  });
  return res;
}
