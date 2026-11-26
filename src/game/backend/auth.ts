import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

/** Server-side auth — Phase 7.
 *  Passwords: scrypt with per-user random salt, constant-time compare.
 *  Sessions: 32-byte random tokens, sha256-hashed at rest. Store interface is
 *  pluggable (in-memory for dev; Postgres adapter is the production path).
 *  Never trust client game state — saves are server-authoritative. */

export interface UserRecord {
  id: string;
  username: string;
  passHash: string; // salt:hash hex
  createdAt: number;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

export interface AuthStore {
  getUserByName(name: string): Promise<UserRecord | null>;
  getUserById(id: string): Promise<UserRecord | null>;
  createUser(rec: UserRecord): Promise<void>;
  putSession(rec: SessionRecord): Promise<void>;
  getSession(tokenHash: string): Promise<SessionRecord | null>;
  deleteSession(tokenHash: string): Promise<void>;
}

/** In-memory dev store — resets on server restart. Swap for Postgres in prod. */
export function createMemoryAuthStore(): AuthStore {
  const users = new Map<string, UserRecord>();
  const byName = new Map<string, UserRecord>();
  const sessions = new Map<string, SessionRecord>();
  return {
    async getUserByName(name) { return byName.get(name) ?? null; },
    async getUserById(id) { return users.get(id) ?? null; },
    async createUser(rec) {
      if (byName.has(rec.username)) throw new Error('username_taken');
      users.set(rec.id, rec);
      byName.set(rec.username, rec);
    },
    async putSession(rec) { sessions.set(rec.tokenHash, rec); },
    async getSession(tokenHash) {
      const s = sessions.get(tokenHash);
      if (!s) return null;
      if (s.expiresAt < Date.now()) {
        sessions.delete(tokenHash);
        return null;
      }
      return s;
    },
    async deleteSession(tokenHash) { sessions.delete(tokenHash); }
  };
}

// ---- password hashing (scrypt) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---- sessions ----

const SESSION_DAYS = 14;

export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function tokenHashOf(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionExpiry(): number {
  return Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
}

// ---- input validation ----

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Username must be 3-20 chars: letters, numbers, underscore.';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Password must be 8-128 characters.';
  }
  return null;
}

// ---- rate limiting (per-key, fixed window) ----

export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    h.count += 1;
    return h.count <= max;
  };
}
