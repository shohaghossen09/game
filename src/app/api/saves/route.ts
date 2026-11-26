import { NextResponse } from 'next/server';
import {
  authStore, saveStore, tokenHashOf, sessionCookieName,
  validateSavePayload, validateSlot, saveLimiter
} from '@/game/backend/store';

export const runtime = 'nodejs';

function sessionKey(req: Request): string {
  return req.cookies.get(sessionCookieName)?.value?.slice(0, 16) ?? 'anon';
}

async function currentUser(req: Request) {
  const token = req.cookies.get(sessionCookieName)?.value;
  if (!token) return null;
  const session = await authStore.getSession(tokenHashOf(token));
  if (!session) return null;
  return authStore.getUserById(session.userId);
}

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const url = new URL(req.url);
  const slot = Number(url.searchParams.get('slot'));
  if (!validateSlot(slot)) {
    return NextResponse.json({ error: 'Invalid slot.' }, { status: 400 });
  }
  const save = await saveStore.get(user.id, slot);
  if (!save) {
    return NextResponse.json({ error: 'Empty slot.' }, { status: 404 });
  }
  return NextResponse.json({ save });
}

export async function PUT(req: Request) {
  if (!saveLimiter(sessionKey(req))) {
    return NextResponse.json({ error: 'Too many saves. Slow down.' }, { status: 429 });
  }
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const url = new URL(req.url);
  const slot = Number(url.searchParams.get('slot'));
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
  await saveStore.put(user.id, slot, body);
  return NextResponse.json({ ok: true });
}
