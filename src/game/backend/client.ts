/** Client-side cloud save service — talks to /api/saves when authenticated,
 *  falls back to localStorage otherwise. The pause menu calls these; the
 *  engine data itself comes via travelState.saveRequest as before. */

import type { SaveData } from '../saves/saves';
import { saveGame as localSave, loadGame as localLoad } from '../saves/saves';

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch('/api/auth/session');
    return (await res.json()) as AuthStatus;
  } catch {
    return { authenticated: false };
  }
}

export async function cloudSave(slot: number, data: SaveData): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await fetch(`/api/saves?slot=${slot}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      // keep a local copy too — offline resilience
      localSave(slot, data);
      return { ok: true, msg: `Saved to cloud slot ${slot}` };
    }
    const json = (await res.json()) as { error?: string };
    return { ok: false, msg: json.error ?? 'Cloud save failed.' };
  } catch {
    localSave(slot, data);
    return { ok: false, msg: 'Offline — saved locally instead.' };
  }
}

export async function cloudLoad(slot: number): Promise<{ ok: boolean; msg: string; data?: SaveData }> {
  try {
    const res = await fetch(`/api/saves?slot=${slot}`);
    if (res.ok) {
      const json = (await res.json()) as { save: { data: SaveData } };
      return { ok: true, msg: `Loaded cloud slot ${slot}`, data: json.save.data };
    }
    if (res.status === 404) {
      // fall back to local
      const local = localLoad(slot);
      if (local) return { ok: true, msg: `Loaded local slot ${slot}`, data: local };
      return { ok: false, msg: `Slot ${slot} is empty.` };
    }
    if (res.status === 401) {
      const local = localLoad(slot);
      if (local) return { ok: true, msg: `Loaded local slot ${slot}`, data: local };
      return { ok: false, msg: 'Not signed in — local saves only.' };
    }
    return { ok: false, msg: 'Cloud load failed.' };
  } catch {
    const local = localLoad(slot);
    if (local) return { ok: true, msg: `Loaded local slot ${slot}`, data: local };
    return { ok: false, msg: 'Offline and no local save.' };
  }
}
