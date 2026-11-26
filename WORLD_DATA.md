# World Data

## Real data pipeline (required for geographic accuracy)

1. `npm run fetch:world` runs `scripts/fetch-dhaka.mjs`
2. Queries the Overpass API for a Dhanmondi bounding box:
   lon 90.3645..90.3895, lat 23.7385..23.7565
3. Converts OSM ways to a tile JSON:
   - roads: centerline segments + width by OSM highway class
     (motorway 18m ... service 7m), kind (major/local/residential)
   - buildings: footprint centroid + bounds + height from
     `building:levels` (default 2 levels)
   - water: polygons approximated as circles
   - coordinates: meters relative to the tile origin
     (23.7461 N, 90.3767 E), local planar approximation
4. Writes `public/world/dhanmondi.json` — the game fetches it at runtime

## PREVIEW fallback (honesty policy)

If the tile JSON is missing, the game generates a deterministic
Dhanmondi-INSPIRED preview layout. It is labeled
`PREVIEW LAYOUT - NOT MAP DATA` in the HUD. It is original artistic
content, not survey data, and must never be presented as real geography.

## Attribution

OpenStreetMap data (c) OpenStreetMap contributors, ODbL 1.0.
Any distribution of baked tiles must carry this attribution (this file and
the README do). The preview layout is original IP.

## Future (Phase 6)

- PostGIS district database, 64-district tile registry
- Terrain elevation datasets merged into tiles
- Streaming tile format (binary, worker-decoded)
