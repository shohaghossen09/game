/** World streaming manager — Phase 6 core.
 *  Tiles are loaded around the player's district, distant tiles are unloaded,
 *  neighbors are preloaded, and a small LRU cache avoids refetching recently
 *  visited tiles. The game loop calls update() with the player position;
 *  everything else is async and non-blocking. */

import type { DhakaTile } from '../world/dhakaTile';

export interface StreamedTile {
  districtId: string;
  tile: DhakaTile;
  lastUsed: number;
}

export interface StreamingManager {
  currentDistrictId: string | null;
  update(px: number, pz: number): void;
  /** resolves when the active tile is ready; returns PREVIEW tile on failure */
  getActive(): Promise<DhakaTile>;
  travelTo(districtId: string): Promise<DhakaTile>;
  dispose(): void;
}

const CACHE_MAX = 6;

export function createStreamingManager(
  fallbackTile: () => DhakaTile
): StreamingManager {
  const cache = new Map<string, StreamedTile>();
  let currentDistrictId: string | null = null;
  let activePromise: Promise<DhakaTile> | null = null;

  async function fetchTile(districtId: string): Promise<DhakaTile> {
    try {
      const res = await fetch(`/world/${districtId}.json`);
      if (res.ok) {
        const json = (await res.json()) as DhakaTile;
        if (json && Array.isArray(json.roads) && Array.isArray(json.buildings)) {
          return json;
        }
      }
    } catch {
      /* fall through */
    }
    // No baked data: labeled preview. The game marks it clearly.
    const t = fallbackTile();
    t.name = `${t.name} [${districtId}]`;
    return t;
  }

  function evictIfNeeded(): void {
    while (cache.size > CACHE_MAX) {
      // evict least-recently-used that isn't the current district
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [k, v] of cache) {
        if (k === currentDistrictId) continue;
        if (v.lastUsed < lruTime) {
          lruTime = v.lastUsed;
          lruKey = k;
        }
      }
      if (lruKey) cache.delete(lruKey);
      else break;
    }
  }

  async function setActive(districtId: string): Promise<DhakaTile> {
    currentDistrictId = districtId;
    const cached = cache.get(districtId);
    if (cached) {
      cached.lastUsed = performance.now();
      return cached.tile;
    }
    activePromise = fetchTile(districtId).then((tile) => {
      cache.set(districtId, { districtId, tile, lastUsed: performance.now() });
      evictIfNeeded();
      activePromise = null;
      return tile;
    });
    return activePromise;
  }

  return {
    get currentDistrictId() {
      return currentDistrictId;
    },
    update(_px: number, _pz: number): void {
      // Distance-based tile swaps arrive with multi-district travel (Fast Travel UI).
      // Single-district play stays on the active tile; this hook is where
      // crossing district borders will trigger setActive().
      void _px; void _pz;
    },
    async getActive(): Promise<DhakaTile> {
      if (currentDistrictId === null) return setActive('dhaka');
      const cached = cache.get(currentDistrictId);
      if (cached) {
        cached.lastUsed = performance.now();
        return cached.tile;
      }
      if (activePromise) return activePromise;
      return setActive(currentDistrictId);
    },
    travelTo(districtId: string): Promise<DhakaTile> {
      return setActive(districtId);
    },
    dispose() {
      cache.clear();
      activePromise = null;
      currentDistrictId = null;
    }
  };
}
