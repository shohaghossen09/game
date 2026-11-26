/** Travel + save bridge: React UI writes requests here; the engine polls and
 *  executes them in the game loop. Mutable, outside Zustand — frame-level data. */

import { DISTRICTS, type DistrictInfo } from '@/game/geography/districts';

export const travelState = {
  districts: DISTRICTS as readonly DistrictInfo[],
  currentDistrict: 'dhaka' as string,
  /** set by the map UI; engine consumes and clears */
  travelRequest: null as string | null,
  /** set by save UI; engine consumes and clears */
  saveRequest: null as { slot: number; kind: 'save' | 'load' } | null,
  /** progress feedback for travel (0..1, 1 = done) */
  travelProgress: 0,
  travelTarget: null as string | null
};
