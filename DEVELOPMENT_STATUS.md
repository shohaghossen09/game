# Development Status — v0.4.0 (audit-upgrade, Phases A–H)

## Phase A — Audit (COMPLETE)
Full source audit of the deployed tree; findings in AUDIT_REPORT.md.
Critical: A1 (Ready before first frame), A2 (context loss), A3 (rAF boot
hang), A4 (no WebGL probe). Cleared: Rapier not installed; physics grid
sound; strict TS on (missing CI was the real gap).

## Phase B — Startup hardening (COMPLETE)
webglDetect probe · first-frame gate · 20s watchdog · rAF-or-timeout
boot yields · context-lost/restored handling · render try/catch · honest
FPS · retry button · boot phases · HUD equality guard.

## Phase C — Rendering/physics (COMPLETE)
Startup and render error paths fixed in B; physics confirmed sound.

## Phase D — Dhanmondi environment (COMPLETE)
Modular buildings: textured facades (4 styles), window grids, balconies,
storefronts, doors, parapets, brick boundary walls. All detail elements
instenced across all buildings. Curbs on sidewalks. Lane strips merged
(58 draws → 1).

## Phase E — PBR materials and lighting (COMPLETE)
Procedural canvas textures (asphalt, concrete, plaster, brick): base
color + roughness maps, deterministic, sRGB-correct, zero external
assets. ACES filmic tone mapping. Per-style facade tints.

## Phase F — Monitoring (COMPLETE)
perf.ts real renderer.info sampler; DevPanel (F3) with every real
metric, unsupported metrics labeled honestly.

## Phase G — Geographic streaming (COMPLETE)
geo/coords.ts (WGS84 transforms, sub-tile indexing) · geo/registry.ts
(64 districts) · geo/streaming.ts (LRU 4-tile cache, neighbor preload,
dedup, eviction, PREVIEW fallback) · stagedLoader.ts (frame-yielding
swaps) · TravelPanel (M key, 64-district map) · dev panel streaming
stats.

## Phase H — Optimization layer (COMPLETE)
- `core/adaptive.ts`: adaptive resolution — rolling FPS average drives a
  0.6–1.0 render-scale factor (0.05 steps, 1.5s cooldown, hysteresis);
  multiplies the quality profile's pixel-ratio cap, never exceeds it
- `world/lod.ts`: building LOD — windows (coarse) kept to 220 m,
  balconies/parapets (detail) kept to 90 m; both instanced, so culling
  is two visibility toggles per frame, zero allocation
- `buildings.ts`: detail layers split (coarse vs detail groups) for LOD
- `builder.ts`: LOD groups surfaced to the engine
- Engine: adaptive resolution loop integrated (checked 2 Hz with FPS
  reporting); LOD updates each frame from camera position; live quality
  switching — LOW/MEDIUM/HIGH/ULTRA change shadows, fog, and pixel
  ratio immediately via the store subscription, no reboot
- Dev panel: quality profile buttons (Task 9's LOW/MEDIUM/HIGH/ULTRA)

## Honest remaining work
- Real map data still needs one local `npm run fetch:world` + commit
- CI typecheck workflow still blocked (GitHub token `workflow` scope)
- Task 11 before/after measurements: deploy, F3, record your baseline
- WebGPU render path, worker tile decode: future phases

## Controls
WASD move · Shift run · Space jump · E vehicle · mouse drag camera ·
M travel map · F3 dev panel (quality switcher inside) · touch joystick +
RUN/JUMP/E on mobile

## Deploy
Branch `audit-upgrade` is deployable as-is. In Vercel set the production
branch to `audit-upgrade`, or merge into `phase-1` and redeploy.
