# Roadmap

## Phase 1 — Foundation (COMPLETE, v0.1.0)
- [x] Project scaffold (Next.js 14 + strict TS + Three.js 0.160 + Zustand)
- [x] Game canvas, renderer, camera rig
- [x] Physics: capsule-vs-AABB collision engine (Rapier swap = Phase 2)
- [x] Third-person character controller (walk/run/jump/swim)
- [x] Drivable car (arcade model, real collision)
- [x] Day/night cycle, fog, shadows
- [x] Quality profiles (Low/Medium/High/Ultra)
- [x] Loading screen with real async progress
- [x] Desktop keyboard/mouse + mobile touch controls
- [x] World data bake script + labeled PREVIEW fallback
- [x] Documentation set

## Phase 2 — Dhaka Prototype
- [ ] Real Dhanmondi roads/buildings/water from baked OSM tile
- [ ] Rapier 3D integration behind the same physics interface
- [ ] Building style variation by road class
- [ ] Street props: benches, signage, bus stops
- [ ] Minimap
- [ ] Pause menu + quality switch UI

## Phase 3 — Gameplay
- [ ] Vehicle categories with distinct handling (CNG, rickshaw, motorcycle, bus, truck)
- [ ] Building interiors (modular door system, prioritized buildings)
- [ ] Swimming polish: underwater camera, water entry/exit
- [ ] Interaction system (shops, doors, objects) with unified prompts

## Phase 4 — Environment
- [ ] Weather: rain, heavy rain, fog, thunderstorm, monsoon effects
- [ ] Water rendering: waves, shorelines, reflections
- [ ] Audio: engines, rain, city/village ambience (licensed or original)
- [ ] Vegetation expansion, seasonal variation

## Phase 5 — Living World
- [ ] Pedestrian NPCs with navigation + distance-based LOD
- [ ] Traffic AI on the road graph
- [ ] Traffic lights, intersections, congestion basics

## Phase 6 — Bangladesh Expansion
- [ ] District database (PostGIS) + 64-district tile registry
- [ ] World streaming manager (tile load/unload/preload, caching)
- [ ] Regional building styles (Dhaka urban -> rural -> coastal)
- [ ] Terrain elevation

## Phase 7 — Backend
- [ ] Auth (registration/login, secure hashing, rate limiting)
- [ ] Cloud saves (server-authoritative), multiple slots
- [ ] Player profiles, settings sync
- [ ] WebSocket foundation for future multiplayer

## Phase 8 — Optimization
- [ ] WebGPU renderer behind feature detect
- [ ] Occlusion culling, texture compression, workers for tile decode
- [ ] Profiling on real hardware, adaptive resolution
- [ ] Cross-browser matrix testing
