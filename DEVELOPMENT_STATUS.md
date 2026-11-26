# Development Status — v0.3.0 (audit-upgrade, Phases A–G)

## Phase A — Audit (COMPLETE)
Full source audit of the deployed tree; findings in AUDIT_REPORT.md.
Critical: A1 (Ready before first frame), A2 (context loss), A3 (rAF boot
hang), A4 (no WebGL probe). Cleared: Rapier not installed; physics grid
sound; strict TS on (missing CI was the real gap).

## Phase B — Startup hardening (COMPLETE)
webglDetect.ts probe · first-frame gate · 20s watchdog · rAF-or-timeout
boot yields · context-lost/restored handling · render try/catch · honest
FPS · retry button · boot phases · HUD equality guard.

## Phase C — Rendering/physics (COMPLETE)
Startup and render error paths fixed in B; physics confirmed sound in the
audit. Vehicle oriented-collision remains a listed polish item.

## Phase D — Dhanmondi environment (COMPLETE)
Modular buildings: textured facades (4 styles), window grids, balconies,
storefronts, doors, parapets, brick boundary walls. Windows/balconies/
trims instanced across all buildings (3 element draws). Curbs on all
sidewalks. Lane strips merged into 1 draw (was ~58).

## Phase E — PBR materials and lighting (COMPLETE)
Procedural canvas textures: asphalt, concrete, plaster, brick — base
color + roughness maps, deterministic, sRGB-correct, zero external
assets. ACES filmic tone mapping. Per-style facade tints.

## Phase F — Optimization + monitoring (COMPLETE)
perf.ts real renderer.info sampler (draw calls, triangles, GPU
geometries/textures, programs, JS heap where supported, 2 Hz).
DevPanel (F3): every real metric; unsupported metrics labeled, never
faked.

## Phase G — Geographic tile streaming (COMPLETE — Tasks 5 & 7)
- `src/game/geo/coords.ts`: WGS84 <-> tile-local meter transforms,
  sub-tile grid indexing (500 m), equirectangular distance
- `src/game/geo/registry.ts`: all 64 districts with real coordinates,
  nearest-district lookup for preloading
- `src/game/geo/streaming.ts`: streaming manager — LRU cache (active +
  3 neighbors), geographic neighbor preloading at 1 Hz, in-flight
  deduplication (never double-fetches), eviction bounded at 4 tiles,
  unbaked districts get the clearly labeled PREVIEW fallback
- `src/game/core/stagedLoader.ts`: frame-yielding staged builds —
  district swaps never freeze the loop
- `src/game/core/travelState.ts`: UI -> engine travel bridge (outside
  React render path)
- `TravelPanel.tsx`: 64-district map UI (M key or MAP button), travel
  progress, honest preview labeling
- Dev panel shows live streaming stats: active tile, cached tiles,
  in-flight loads
- Player position preserved across swaps (relocated to tile start;
  exiting vehicle handled); sim pauses during swap steps, rendering
  continues

## Honest remaining work
- Real map data still needs one local `npm run fetch:world` run +
  commit (bakes Dhanmondi from OpenStreetMap). Other districts: bake
  with the existing fetch:district script pattern.
- CI typecheck workflow still blocked by the GitHub token's missing
  `workflow` scope — add the 12-line file manually (AUDIT_REPORT.md).
- Before/after performance measurement on real hardware (Task 11) —
  deploy this branch, open F3, record the numbers on YOUR device.
- WebGPU renderer path, worker-based tile decode, and mobile viewport
  testing remain future phases.

## Controls
WASD move · Shift run · Space jump · E vehicle · mouse drag camera ·
M travel map · F3 dev panel · touch joystick + RUN/JUMP/E on mobile

## Deploy
Branch `audit-upgrade` is deployable as-is. Vercel: set the production
branch to `audit-upgrade`, or merge into `phase-1` and redeploy.
