# Development Status — v0.1.0 (Phase 1)

## Implemented and committed
- Next.js 14 + strict TypeScript scaffold
- Single-canvas imperative engine loop (no R3F)
- Collision: capsule vs building AABBs, spatial-grid queries, least-penetration pushout
- Third-person character: articulated limbs, walk/run/jump, camera-relative movement
- Follow camera: exponential damping, mouse-drag orbit, vehicle pull-back
- Drivable car: enter/exit (E), acceleration, brake, reverse, speed-scaled steering,
  building collision with speed loss, wheel rotation, km/h HUD
- Swimming/buoyancy in water zones
- Day/night cycle (~5 min), dynamic sun/sky/fog, clock readout
- Loading screen with real boot-step progress (no fake bar)
- HUD: location, clock, day/night, FPS, speed, interaction prompt, PREVIEW warning
- Mobile: virtual joystick, RUN/JUMP/E buttons, auto-shown on coarse pointers
- Quality profiles Low/Medium/High/Ultra (render scale, shadows, fog, trees)
- PREVIEW world layout fallback — deterministic, clearly labeled
- Real-data baker script: `npm run fetch:world` (Overpass -> tile JSON)
- Docs: README, ARCHITECTURE, ROADMAP, DEVELOPMENT_STATUS, GAME_SYSTEMS,
  WORLD_DATA, PERFORMANCE, TESTING

## Not yet implemented (honest)
- Real OSM data requires one run of `npm run fetch:world` (network needed)
- No building interiors, NPCs, traffic, weather, audio, saves, minimap, pause menu
- WebGPU not enabled (WebGL2 only in Phase 1)
- One vehicle type (sedan); category physics (CNG, rickshaw, bus...) is Phase 3
- Quality profile switch UI not wired (store field exists; menu is Phase 2)

## Known issues
- Sidewalk boxes do not collide with the car (ramp simplification, revisit Phase 2)
- Car body uses an AABB approximation, not oriented collision (Rapier swap fixes)
- Camera can clip buildings on fast 180-degree turns (rare)

## Next tasks (Phase 2)
1. Bake real Dhanmondi tile and verify road widths vs OSM highway tags
2. Rapier 3D swap behind the CollisionWorld interface
3. Building style rules by road class; street props
4. Minimap component
