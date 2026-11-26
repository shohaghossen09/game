# Roadmap — v0.5.0 status

All 8 original phases have shipped a first implementation. Remaining work
is deepening, not greenfield.

## Phase 1 — Foundation (COMPLETE)
Engine, world, player, physics, vehicle, camera, day/night, quality
profiles, loading screen, mobile controls, OSM baker, docs.

## Phase 2 — Dhaka Prototype (COMPLETE)
Minimap, pause menu + live quality switch, street props.
(Deferred: Rapier swap — the AABB engine remains stable and fast.)

## Phase 3 — Gameplay (COMPLETE)
5 vehicle categories, water/swim, 9 enterable shop interiors, prompts.

## Phase 4 — Environment (COMPLETE)
Weather machine, GPU rain, grip, visibility, thunder.
Procedural audio: engine loops, rain, footsteps, ambience.

## Phase 5 — Living World (COMPLETE)
Pedestrian NPCs (instanced, distance LOD), traffic AI, traffic lights
with car obedience.

## Phase 6 — Bangladesh Expansion (COMPLETE — first pass)
64-district registry, streaming manager with LRU, district travel,
district baker for 16 major districts, labeled PREVIEW fallback.

## Phase 7 — Backend (COMPLETE — first pass)
Accounts (scrypt, hashed sessions, httpOnly cookies, rate limits),
cloud saves (server-authoritative, 3 slots), auth UI.

## Phase 8 — Optimization (COMPLETE — first pass)
Adaptive resolution, staged async travel (no hitch), WebGPU detector,
expanded testing matrix.

---

## Deepening backlog (post-v0.5.0, priority order)

1. **Postgres/PostGIS adapters** for AuthStore + SaveStore (production
   persistence; interfaces already defined)
2. **WebGPU renderer integration** (detector shipped; gate on three.js
   WebGPURenderer stability for this scene profile)
3. **Bake all 64 districts** (extend fetch-district.mjs DISTRICTS table from
   the registry; then remove PREVIEW fallback usage in practice)
4. **Interiors merged with real OSM footprints** (baker pass)
5. **Worker tile decode + binary tile format** (travel decode off the
   main thread)
6. **Multiplayer foundation** (WebSockets; authoritative positions for
   vehicles + players)
7. **Password recovery** (email sender infra)
8. **Traffic intersection negotiation** (replace proximity with lane
   reservation at crossings)
9. **Seasonal environment variation** (monsoon flooding, wet-season
   visuals — Bangladesh-specific)
10. **Voice/crowd audio, radio in vehicles** (procedural or licensed)
