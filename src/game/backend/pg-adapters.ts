/** Postgres adapters — production persistence (deepening backlog #1).
 *  Implements the same AuthStore / SaveStore interfaces the in-memory dev
 *  stores use, so store.ts swaps them in behind DATABASE_URL with zero
 *  route changes. `pg` is a lazy peer import: dev installs without it work
 *  unchanged. All SQL is parameterized — no string concatenation of user data. */

import type { AuthStore, UserRecord, SessionRecord } from './auth';
import type { SaveStore, CloudSave } from './saves';

interface PgClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
}

async function getClient(): Promise<PgClient> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const mod = (await import('pg')) as unknown as {
    Client: new (config: { connectionString: string }) => PgClient & { connect(): Promise<void> };
  };
  const client = new mod.Client({ connectionString: url });
  await client.connect();
  return client;
}

async function withClient<T>(fn: (c: PgClient) => Promise<T>): Promise<T> {
  const c = await getClient();
  try {
    return await fn(c);
  } finally {
    void c.end();
  }
}

function rowToUser(row: Record<string, unknown> | undefined): UserRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    username: String(row.username),
    passHash: String(row.pass_hash),
    createdAt: Number(row.created_at)
  };
}

// ---------- AuthStore adapter ----------

export function createPgAuthStore(): AuthStore {
  return {
    async getUserByName(name) {
      return withClient(async (c) => {
        const res = await c.query(
          'SELECT id, username, pass_hash, created_at FROM bls_users WHERE username_lc = $1 LIMIT 1',
          [name.toLowerCase()]
        );
        return rowToUser(res.rows[0]);
      });
    },
    async getUserById(id) {
      return withClient(async (c) => {
        const res = await c.query(
          'SELECT id, username, pass_hash, created_at FROM bls_users WHERE id = $1 LIMIT 1',
          [id]
        );
        return rowToUser(res.rows[0]);
      });
    },
    async createUser(rec) {
      await withClient(async (c) => {
        try {
          await c.query(
            'INSERT INTO bls_users (id, username, username_lc, pass_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
            [rec.id, rec.username, rec.username.toLowerCase(), rec.passHash, rec.createdAt]
          );
        } catch (e) {
          if (e instanceof Error && /unique/i.test(e.message)) {
            throw new Error('username_taken');
          }
          throw e;
        }
      });
    },
    async putSession(rec) {
      await withClient(async (c) => {
        await c.query(
          'INSERT INTO bls_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
          [rec.tokenHash, rec.userId, rec.expiresAt]
        );
      });
    },
    async getSession(tokenHash) {
      return withClient(async (c) => {
        const res = await c.query(
          'SELECT token_hash, user_id, expires_at FROM bls_sessions WHERE token_hash = $1 LIMIT 1',
          [tokenHash]
        );
        const r = res.rows[0];
        if (!r) return null;
        const s: SessionRecord = {
          tokenHash: String(r.token_hash),
          userId: String(r.user_id),
          expiresAt: Number(r.expires_at)
        };
        if (s.expiresAt < Date.now()) {
          await c.query('DELETE FROM bls_sessions WHERE token_hash = $1', [tokenHash]);
          return null;
        }
        return s;
      });
    },
    async deleteSession(tokenHash) {
      await withClient(async (c) => {
        await c.query('DELETE FROM bls_sessions WHERE token_hash = $1', [tokenHash]);
      });
    }
  };
}

// ---------- SaveStore adapter ----------

export function createPgSaveStore(): SaveStore {
  return {
    async put(userId, slot, data) {
      await withClient(async (c) => {
        await c.query(
          `INSERT INTO bls_saves (user_id, slot, data, saved_at)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (user_id, slot)
           DO UPDATE SET data = EXCLUDED.data, saved_at = EXCLUDED.saved_at`,
          [userId, slot, JSON.stringify(data), Date.now()]
        );
      });
    },
    async get(userId, slot) {
      return withClient(async (c) => {
        const res = await c.query(
          'SELECT data, saved_at FROM bls_saves WHERE user_id = $1 AND slot = $2 LIMIT 1',
          [userId, slot]
        );
        const r = res.rows[0];
        if (!r) return null;
        const save: CloudSave = {
          userId,
          slot,
          data: r.data,
          savedAt: Number(r.saved_at)
        };
        return save;
      });
    },
    async list(userId) {
      return withClient(async (c) => {
        const res = await c.query(
          'SELECT slot, saved_at FROM bls_saves WHERE user_id = $1 ORDER BY slot',
          [userId]
        );
        return res.rows.map((r) => ({
          slot: Number(r.slot),
          savedAt: Number(r.saved_at)
        }));
      });
    },
    async delete(userId, slot) {
      await withClient(async (c) => {
        await c.query('DELETE FROM bls_saves WHERE user_id = $1 AND slot = $2', [userId, slot]);
      });
    }
  };
}
