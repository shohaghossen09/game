/** Cloud saves — Phase 7. Server-authoritative: the client sends save data,
 *  the server validates its shape/size and stores it keyed by USER (not by
 *  anything the client claims). Loading requires a valid session.
 *  In-memory dev store; Postgres adapter is the production path. */

export interface CloudSave {
  userId: string;
  slot: number; // 1..3
  data: unknown; // validated JSON blob
  savedAt: number;
}

export interface SaveStore {
  put(userId: string, slot: number, data: unknown): Promise<void>;
  get(userId: string, slot: number): Promise<CloudSave | null>;
  list(userId: string): Promise<Array<{ slot: number; savedAt: number }>>;
  delete(userId: string, slot: number): Promise<void>;
}

export function createMemorySaveStore(): SaveStore {
  const saves = new Map<string, CloudSave>(); // key: userId:slot
  return {
    async put(userId, slot, data) {
      saves.set(`${userId}:${slot}`, {
        userId, slot, data, savedAt: Date.now()
      });
    },
    async get(userId, slot) {
      return saves.get(`${userId}:${slot}`) ?? null;
    },
    async list(userId) {
      const out: Array<{ slot: number; savedAt: number }> = [];
      for (let s = 1; s <= 3; s++) {
        const rec = saves.get(`${userId}:${s}`);
        if (rec) out.push({ slot: s, savedAt: rec.savedAt });
      }
      return out;
    },
    async delete(userId, slot) {
      saves.delete(`${userId}:${slot}`);
    }
  };
}

// ---- validation (server-side, never trusting the client) ----

export const MAX_SAVE_BYTES = 64 * 1024;

export function validateSavePayload(raw: unknown): string | null {
  let size: number;
  try {
    size = Buffer.byteLength(JSON.stringify(raw));
  } catch {
    return 'Save data is not serializable.';
  }
  if (size > MAX_SAVE_BYTES) return 'Save data too large (max 64 KB).';
  if (typeof raw !== 'object' || raw === null) return 'Save data must be an object.';
  const d = raw as Record<string, unknown>;
  if (typeof d.version !== 'number' || d.version !== 1) return 'Unsupported save version.';
  const p = d.player;
  if (typeof p !== 'object' || p === null) return 'Missing player data.';
  const pv = p as Record<string, unknown>;
  for (const k of ['x', 'y', 'z', 'yaw'] as const) {
    if (typeof pv[k] !== 'number' || !Number.isFinite(pv[k])) {
      return `player.${k} must be a finite number.`;
    }
  }
  if (typeof d.dayT !== 'number' || d.dayT < 0 || d.dayT > 1) return 'dayT must be 0..1.';
  if (typeof d.district !== 'string' || d.district.length > 64) return 'Invalid district.';
  return null;
}

export function validateSlot(slot: unknown): slot is number {
  return typeof slot === 'number' && Number.isInteger(slot) && slot >= 1 && slot <= 3;
}
