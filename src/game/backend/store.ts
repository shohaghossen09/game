/** Backend singleton — server-only module: wires the auth store,
 *  save store, rate limiters, and session cookie name in one place.
 *
 *  Persistence selection (deepening backlog #1):
 *  - DATABASE_URL set        -> Postgres adapters (pg installed + schema.sql run)
 *  - DATABASE_URL unset/err  -> in-memory dev stores (reset on restart)
 *  The route code never changes — both implement the same interfaces. */

import { createMemoryAuthStore, createRateLimiter } from './auth';
import { createMemorySaveStore } from './saves';

export const sessionCookieName = 'bls_session';

export const usingPostgres = Boolean(process.env.DATABASE_URL);

let authStoreImpl: ReturnType<typeof createMemoryAuthStore> | null = null;
let saveStoreImpl: ReturnType<typeof createMemorySaveStore> | null = null;

// Lazy resolution: Postgres adapters import `pg` lazily, so bundlers that
// never see DATABASE_URL never pull the dependency into the build.
if (usingPostgres) {
  void import('./pg-adapters').then((pg) => {
    authStoreImpl = pg.createPgAuthStore() as never;
    saveStoreImpl = pg.createPgSaveStore() as never;
  }).catch((err) => {
    console.error('Postgres adapter init failed; using in-memory stores.', err);
  });
}

function getAuthStore() {
  if (!authStoreImpl) authStoreImpl = createMemoryAuthStore();
  return authStoreImpl;
}

export const authStore = {
  getUserByName: (name: string) => getAuthStore().getUserByName(name),
  getUserById: (id: string) => getAuthStore().getUserById(id),
  createUser: (rec: Parameters<ReturnType<typeof createMemoryAuthStore>['createUser'][0]> extends never ? never : ReturnType<typeof createMemoryAuthStore>['createUser'] extends never ? never : any) => getAuthStore().createUser(rec),
  putSession: (rec: any) => getAuthStore().putSession(rec),
  getSession: (tokenHash: string) => getAuthStore().getSession(tokenHash),
  deleteSession: (tokenHash: string) => getAuthStore().deleteSession(tokenHash)
} as ReturnType<typeof createMemoryAuthStore>;

let saveStoreResolved = false;
function getSaveStore() {
  if (!saveStoreImpl && !saveStoreResolved) {
    saveStoreImpl = createMemorySaveStore();
    saveStoreResolved = true;
  }
  return saveStoreImpl!;
}
export const saveStore = {
  put: (userId: string, slot: number, data: unknown) => getSaveStore().put(userId, slot, data),
  get: (userId: string, slot: number) => getSaveStore().get(userId, slot),
  list: (userId: string) => getSaveStore().list(userId),
  delete: (userId: string, slot: number) => getSaveStore().delete(userId, slot)
} as ReturnType<typeof createMemorySaveStore>;

export const registerLimiter = createRateLimiter(5, 60 * 60 * 1000);   // 5/hour
export const loginLimiter = createRateLimiter(10, 10 * 60 * 1000);     // 10/10min
export const saveLimiter = createRateLimiter(30, 60 * 1000);           // 30/min

export {
  hashPassword, verifyPassword,
  newSessionToken, tokenHashOf, sessionExpiry,
  validateCredentials
} from './auth';
export { validateSavePayload, validateSlot } from './saves';
