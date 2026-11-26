/** Save system — Phase 7 preview. localStorage slots now; the same
 *  schema is what the future server-authoritative backend will accept.
 *  Client saves cover convenience state (position, time, weather) — never
 *  used for anything security-relevant. */

export interface SaveData {
  version: 1;
  savedAt: number;
  player: { x: number; y: number; z: number; yaw: number };
  dayT: number;
  weatherKind: string;
  quality: string;
  district: string;
}

export const SAVE_SLOTS = 3;
const KEY = 'bls_save_v1_slot';

export function saveGame(slot: number, data: Omit<SaveData, 'version' | 'savedAt'>): boolean {
  try {
    const full: SaveData = { version: 1, savedAt: Date.now(), ...data };
    localStorage.setItem(`${KEY}_${slot}`, JSON.stringify(full));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slot: number): SaveData | null {
  try {
    const raw = localStorage.getItem(`${KEY}_${slot}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return null; // version gate
    if (typeof parsed.player?.x !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function listSaves(): Array<{ slot: number; savedAt: number | null; district: string | null }> {
  const out: Array<{ slot: number; savedAt: number | null; district: string | null }> = [];
  for (let s = 1; s <= SAVE_SLOTS; s++) {
    const d = loadGame(s);
    out.push({ slot: s, savedAt: d?.savedAt ?? null, district: d?.district ?? null });
  }
  return out;
}

export function deleteSave(slot: number): void {
  try {
    localStorage.removeItem(`${KEY}_${slot}`);
  } catch {
    /* ignore */
  }
}
