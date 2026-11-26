# Roadmap

## Phase 1 — Foundation (COMPLETE)
- [x] Project scaffold (Next.js 14 + strict TS + Three.js 0.160 + Zustand)
- [x] Game canvas, renderer, camera rig
- [x] Physics: capsule-vs-AABB collision engine
- [x] Third-person character controller (walk/run/jump/swim)
- [x] Drivable car, day/night, quality profiles, loading screen
- [x] Desktop keyboard/mouse + mobile touch controls
- [x] World data bake script + labeled PREVIEW fallback

## Phase 2 — Dhaka Prototype (COMPLETE)
- [x] Minimap (canvas, roads/buildings/water/markers)
- [x] Pause menu with live graphics quality switching
- [x] Street props (benches, bins)
- [ ] Rapier 3D integration (kept on the list; current AABB engine is stable)

## Phase 3 — Gameplay (VEHICLES + WATER COMPLETE; INTERIORS PENDING)
- [x] 5 vehicle categories with distinct handling (sedan, CNG, rickshaw,
      motorcycle, bus) + nearest-vehicle entry prompts
- [x] Water: swim states, buoyancy, underwater fog
- [ ] Building interiors (modular door system, prioritized buildings)
- [ ] Interaction system (shops, doors, objects)

## Phase 4 — Environment (WEATHER COMPLETE; AUDIO PENDING)
- [x] Weather state machine: clear -> cloudy -> rain -> heavy rain -> thunderstorm
- [x] GPU rain particles, visibility fog, wet-road grip, thunder flash
- [ ] Audio: engines, rain, ambience (licensed or original assets)
- [ ] Water rendering: waves, shorelines, reflections
- [ ] Puddles/wet-road visual sheen

## Phase 5 — Living World (BASIC COMPLETE)
- [x] Pedestrian NPCs (instanced, sidewalk network, distance LOD)
- [x] Traffic AI (road graph, lanes, car-following)
- [ ] Traffic lights + intersection negotiation
- [ ] NPC reactions to player, conversations

## Phase 6 — Bangladesh Expansion (PENDING)
- [ ] District database (PostGIS) + 64-district tile registry
- [ ] World streaming manager (tile load/unload/preload, caching)
- [ ] Regional building styles (urban -> rural -> coastal)
- [ ] Terrain elevation

## Phase 7 — Backend (PENDING)
- [ ] Auth (registration/login, secure hashing, rate limiting)
- [ ] Cloud saves (server-authoritative), multiple slots
- [ ] Player profiles, settings sync
- [ ] WebSocket foundation for future multiplayer

## Phase 8 — Optimization (PENDING)
- [ ] WebGPU renderer behind feature detect
- [ ] Occlusion culling, texture compression, workers for tile decode
- [ ] Profiling on real hardware, adaptive resolution
- [ ] Cross-browser matrix testing
