/** World streaming manager — Phase G (Task 7).
 *  Responsibilities:
 *  - Load the player's district tile; keep neighbors preloading in background
 *  - Cache recently visited tiles (LRU) to avoid duplicate fetches
 *  - Evict distant tiles from the in-flight + cached sets to bound memory
 *  - Never hold more than MAX_CACHED tiles of JSON geometry in memory
 *
 *  Tile data (JSON) only — GPU mesh building happens in the world builder
 *  when a travel actually swaps the active tile, so streaming bounds CPU
 *  memory, not draw calls. JSON geometry for unbaked districts is NOT
 *  fetched; they get the labeled PREVIEW layout from the existing loader. */

import type { DhakaTile } from '../world/dhakaTile';
import { loadDhakaTile } from '../world/dhakaTile';
import { nearestDistricts } from './registry';

interface CacheEntry {
  districtId: string;
  tile: DhakaTile;
  lastUsed: number;
}

const MAX_CACHED = 4; // active + 3 neighbors (JSON is ~200 KB each)
const PRELOAD_COUNT = 2;

export interface StreamingManager {
  /** The active district id. */
  activeId: string;
  /** Prefetched tile for a district, if cached or preloaded. */
  peek(districtId: string): DhakaTile | null;
  /** Swap the active district; resolves when its tile is ready. */
  activate(districtId: string): Promise<DhakaTile>;
  /** Called each frame: background-loads neighbors of the active tile. */
  update(px: number, pz: number): void;
  /** Tiles currently held (for the dev panel). */
  stats(): { cached: number; inFlight: number; active: string };
  dispose(): void;
}

export function createStreamingManager(): StreamingManager {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<DhakaTile>>();
  let activeId = 'dhaka';

  async function fetchTile(districtId: string): Promise<DhakaTile> {
    if (districtId === 'dhaka' || districtId === 'dhanmondi') {
      // the baked Dhanmondi tile + preview fallback live in loadDhakaTile
      return loadDhakaTile();
    }
    // other districts: baked tile if it exists, PREVIEW fallback otherwise
    try {
      const res = await fetch(`/world/${districtId}.json`);
      if (res.ok) {
        const json = (await res.json()) as DhakaTile;
        if (json && Array.isArray(json.roads) && Array.isArray(json.buildings)) {
          return json;
        }
      }
    } catch {
      /* fall through to preview */
    }
    const { previewTile } = await import('../world/dhakaTile');
    const t = previewTile();
    t.name = `${t.name} [${districtId}]`;
    return t;
  }

  function getOrLoad(districtId: string): Promise<DhakaTile> {
    const cached = cache.get(districtId);
    if (cached) {
      cached.lastUsed = performance.now();
      return Promise.resolve(cached.tile);
    }
    let flight = inFlight.get(districtId);
    if (!flight) {
      flight = fetchTile(districtId).then((tile) => {
        cache.set(districtId, {
          districtId,
          tile,
          lastUsed: performance.now()
        });
        inFlight.delete(districtId);
        evictIfNeeded();
        return tile;
      });
      inFlight.set(districtId, flight);
    }
    return flight;
  }

  function evictIfNeeded(): void {
    while (cache.size > MAX_CACHED) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [k, v] of cache) {
        if (k === activeId) continue;
        if (v.lastUsed < lruTime) {
          lruTime = v.lastUsed;
          lruKey = k;
        }
      }
      if (lruKey) cache.delete(lruKey);
      else break;
    }
  }

  return {
    get activeId() {
      return activeId;
    },
    peek(districtId) {
      return cache.get(districtId)?.tile ?? null;
    },
    async activate(districtId) {
      activeId = districtId;
      return getOrLoad(districtId);
    },
    update(_px, _pz) {
      // background preload the geographically nearest districts of the
      // active one — fires once per district per cache lifetime
      for (const n of nearestDistricts(activeId, PRELOAD_COUNT)) {
        if (!cache.has(n.id) && !inFlight.has(n.id)) {
          void getOrLoad(n.id).catch(() => {
            /* preloading is best-effort; failures surface on activate */
          });
        }
      }
      void _px;
      void _pz;
    },
    stats() {
      return {
        cached: cache.size,
        inFlight: inFlight.size,
        active: activeId
      };
    },
    dispose() {
      cache.clear();
      inFlight.clear();
    }
  };
}
