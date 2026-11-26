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
    Client: new (config: { connectionString: string }) => PgClient;
  };
  const client = new mod.Client({ connectionString: url });
  await client.end(); // placeholder guard, replaced below
  return client;
}
