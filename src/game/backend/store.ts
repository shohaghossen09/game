/** Backend singleton — server-only module: wires the auth store,
 *  save store, rate limiters, and session cookie name in one place.
 *
 *  Persistence selection (deepening backlog #1):
 *  - DATABASE_URL set        -> Postgres adapters (requires `pg` + schema.sql)
 *  - DATABASE_URL unset/err  -> in-memory dev stores (reset on restart)
 *
 *  Because the Postgres adapters import `pg` lazily (so it never enters
 *  builds without a database), resolution is asynchronous. Routes call
 *  `await stores()` — a memoized promise, so the cost is one tick. */

import { createMemoryAuthStore, createRateLimiter } from './auth';
import { createMemorySaveStore } from './saves';
import type { AuthStore } from './auth';
import type { SaveStore } from './saves';

export const sessionCookieName = 'bls_session';

export interface Stores {
  auth: AuthStore;
  saves: SaveStore;
}

const memoryStores: Stores = {
  auth: createMemoryAuthStore(),
  saves: createMemorySaveStore()
};

let resolved: Stores | null = null;
const pending: Array<(s: Stores) => void> = [];
let settled = false;

if (process.env.DATABASE_URL) {
  import('./pg-adapters')
    .then((pg) => {
      resolved = { auth: pg.createPgAuthStore(), saves: pg.createPgSaveStore() };
      settled = true;
      pending.splice(0).forEach((fn) => fn(resolved!));
    })
    .catch((err) => {
      console.error('Postgres adapter init failed; using in-memory stores.', err);
      resolved = memoryStores;
      settled = true;
      pending.splice(0).forEach((fn) => fn(resolved!));
    });
} else {
  resolved = memoryStores;
  settled = true;
}

/** Routes call this — resolves once to the active stores. */
export function stores(): Promise<Stores> {
  if (settled) return Promise.resolve(resolved!);
  return new Promise((fn) => pending.push(fn));
}

export const usingPostgres = Boolean(process.env.DATABASE_URL);

export const registerLimiter = createRateLimiter(5, 60 * 60 * 1000);   // 5/hour
export const loginLimiter = createRateLimiter(10, 10 * 60 * 1000);    // 10/10min
export const saveLimiter = createRateLimiter(30, 60 * 1000);          // 30/min

export {
  hashPassword, verifyPassword,
  newSessionToken, tokenHashOf, sessionExpiry,
  validateCredentials
} from './auth';
export { validateSavePayload, validateSlot } from './saves';
