import { NextResponse } from 'next/server';
import {
  stores, tokenHashOf, sessionCookieName,
  validateSavePayload, validateSlot, saveLimiter
} from '@/game/backend/store';

export const runtime = 'nodejs';

function sessionKey(req: Request): string {
  return req.cookies.get(sessionCookieName)?.value?.slice(0, 16) ?? 'anon';
}

export async function GET(req: Request) {
  const { auth, saves } = await stores();
  const token = req.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const session = await auth.getSession(tokenHashOf(token));
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const user = await auth.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const slot = Number(new URL(req.url).searchParams.get('slot'));
  if (!validateSlot(slot)) {
    return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 });
  }
  const save = await saves.get(user.id, slot);
  if (!save) {
    return NextResponse.json({ error: 'Empty slot.' }, { status: 404 });
  }
  return NextResponse.json({ save });
}

export async function PUT(req: Request) {
  if (!saveLimiter(sessionKey(req))) {
    return NextResponse.json({ error: 'Too many saves. Slow down.' }, { status: 429 });
  }
  const { auth, saves } = await stores();
  const token = req.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const session = await auth.getSession(tokenHashOf(token));
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const user = await auth.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const slot = Number(new URL(req.url).searchParams.get('slot'));
  if (!validateSlot(slot)) {
    return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const invalid = validateSavePayload(body);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }
  await saves.put(user.id, slot, body);
  return NextResponse.json({ ok: true });
}
