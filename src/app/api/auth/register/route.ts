import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { stores, registerLimiter, hashPassword, validateCredentials } from '@/game/backend/store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!registerLimiter(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const { username, password } = (body ?? {}) as Record<string, unknown>;

  const invalid = validateCredentials(username, password);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const { auth } = await stores();
  try {
    await auth.createUser({
      id: randomUUID(),
      username: username as string,
      passHash: hashPassword(password as string),
      createdAt: Date.now()
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'username_taken') {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
