# Development Status — v0.2.0 (Phases 1-5)

## Implemented and committed
- Next.js 14 + strict TypeScript scaffold
- Single-canvas imperative engine loop (no R3F)
- Collision: capsule vs building AABBs, spatial-grid queries
- Third-person character: articulated limbs, walk/run/jump/swim, camera-relative movement
- Follow camera: exponential damping, mouse-drag orbit, vehicle pull-back, underwater fog
- Minimap: canvas-based, store-fed, roads/buildings/water/player/vehicle markers
- Pause menu (Esc) with live graphics quality switching (Low/Medium/High/Ultra)
- Street props: benches + bins along major roads
- Vehicle fleet: 5 categories with distinct physics — sedan, CNG auto-rickshaw,
  rickshaw, motorcycle, local bus — nearest-vehicle targeting with labeled prompts
- Water system: swim states (land/wading/swimming/underwater), buoyancy, underwater fog tint
- Weather: state machine (clear -> cloudy -> rain -> heavy rain -> thunderstorm),
  GPU rain particles, visibility fog coupling, road grip (slippery when wet),
  thunder flash, sky darkening
- Pedestrian NPCs: instanced rendering, sidewalk network walking, distance-based LOD
- Traffic AI: road graph following, lane offsets, car-following slowdown,
  instanced, distance-based activation
- Day/night cycle (~5 min), dynamic sun/sky/fog, clock readout
- Loading screen with real boot-step progress
- HUD: location, clock, FPS, speed, prompt, PREVIEW warning
- Mobile: virtual joystick, RUN/JUMP/E buttons
- Real-data baker: npm run fetch:world (Overpass -> tile JSON)
- Documentation set (8 files)

## Not yet implemented (honest)
- Real OSM data requires one run of `npm run fetch:world`
- Building interiors (Phase 3 continuation)
- Audio (Phase 4 continuation)
- Saves/backend (Phase 7)
- World streaming + other 63 districts (Phase 6)
- WebGPU renderer (Phase 8)

## Known issues
- Traffic cars pass through each other at intersections (car-following is
  proximity-based, no intersection negotiation yet)
- NPC edge-picking scans all edges on arrival (fine at current counts; needs
  spatial index if counts grow)
- Camera building clip on fast 180-degree turns (rare)
- Rain does not produce visible puddles yet (wet-road grip is simulated though)

## Next tasks
1. Building interiors: doors + enterable shops on the main avenue
2. Audio: engine loop tied to speed, rain loop tied to intensity, city ambience
3. Intersection negotiation for traffic + traffic lights
4. Save system (localStorage slot for Phase 7 backend preview)
