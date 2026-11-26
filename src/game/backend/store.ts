/** Backend singleton — Phase 7. Server-only module: wires the auth store,
 *  save store, rate limiters, and session cookie name in one place.
 *  Dev = in-memory stores; production = Postgres adapters implementing the
 *  same interfaces (see saves.ts / auth.ts for the interface contracts). */

import { createMemoryAuthStore } from './auth';
import { createMemorySaveStore } from './saves';
import { createRateLimiter } from './auth';

export const sessionCookieName = 'bls_session';

export const authStore = createMemoryAuthStore();
export const saveStore = createMemorySaveStore();

export const registerLimiter = createRateLimiter(5, 60 * 60 * 1000);   // 5/hour
export const loginLimiter = createRateLimiter(10, 10 * 60 * 1000);     // 10/10min
export const saveLimiter = createRateLimiter(30, 60 * 1000);           // 30/min

// re-export the helpers the routes use
export {
  hashPassword, verifyPassword,
  newSessionToken, tokenHashOf, sessionExpiry,
  validateCredentials
} from './auth';
export { validateSavePayload, validateSlot } from './saves';
