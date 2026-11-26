# Development Status — v0.3.0 (Phases 1-6)

## Implemented and committed
- Engine, world, player, physics, vehicles (5 categories), water/swim, weather,
  pedestrians, traffic AI, minimap, pause menu, quality profiles — see v0.2.0 notes
- **Interiors (Phase 3 complete)**: 9 enterable shops on the main avenue —
  doorway gaps, interior walls/floors, counters, shelves, awnings, point lights;
  inside/outside detection; prompts; indoor ambience ducking
- **Audio (Phase 4 complete)**: 100% procedural WebAudio — speed-pitched engine
  loops per vehicle category, intensity-scaled rain noise, footsteps, ambience
  bed; unlocked on first user gesture (autoplay policy compliant); zero
  licensed assets (original by construction)
- **Traffic lights (Phase 5 complete)**: cycling green/yellow/red with visual
  lamps at avenue intersections; stop-line queries for traffic AI
- **Saves (Phase 7 preview)**: 3 localStorage slots, versioned schema;
  save/load player position, time-of-day, weather, quality, district
- **District registry (Phase 6)**: all 64 districts with coordinates and
  regional style keys (dhaka-urban, city-core, riverine, coastal, hill,
  tea-garden, rural)
- **Streaming (Phase 6)**: tile cache with LRU eviction, district travel via
  the in-game map, full world rebuild on travel, preview fallback for
  unbaked districts (clearly labeled)
- **District baker**: `npm run fetch:district -- <id> [sizeKm]` bakes real
  OpenStreetMap data for 16 major districts

## Not yet implemented (honest)
- PostGIS server-side tile hosting (tiles are static JSON files for now)
- Distance-based streaming transitions (travel is currently menu-driven)
- Rapier 3D physics swap (current AABB engine remains stable)
- WebGPU renderer (Phase 8)
- Multiplayer, accounts, server-authoritative saves (Phase 7 proper)
- Traffic light obedience wired into traffic cars (lights render + cycle;
  cars slow via car-following only — the shouldStop() API exists, wiring it
  into the traffic update is the next small task)

## Known issues
- District travel rebuilds everything synchronously (~200ms hitch) — fine for
  menu travel; seamless streaming needs async chunk loading (Phase 8)
- Interiors place shops at fixed avenue slots; real OSM building data may
  overlap them (baker strips building footprints overlapping doorways in a
  future pass)
- NPC edge-picking is O(edges) on arrival — fine at current counts

## Next tasks
1. Wire traffic-light shouldStop() into traffic car update
2. Async chunked travel loading (remove the hitch)
3. Regional building style application by district style key
4. Server backend: auth + cloud saves (Phase 7 proper)
