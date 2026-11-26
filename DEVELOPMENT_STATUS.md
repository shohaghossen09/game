# Development Status — v0.2.0 (audit-upgrade, Phases A–F)

## Phase A — Audit (COMPLETE)
Full source audit of the deployed tree; findings in AUDIT_REPORT.md.
Critical: A1 (Ready before first frame), A2 (context loss), A3 (rAF boot
hang), A4 (no WebGL probe). Cleared: Rapier not installed (prompt assumed
it); physics grid sound; strict TS on (missing CI was the real gap).

## Phase B — Startup hardening (COMPLETE)
webglDetect.ts probe · first-frame gate · 20s watchdog · rAF-or-timeout
boot yields · context-lost/restored handling · render try/catch ·
honest FPS · retry button · boot-phase states · HUD equality guard.

## Phase C — Rendering/physics (COMPLETE via B + clearances)
Startup, render, and error paths fixed in B. Physics confirmed sound in
audit (A4 cleared). Vehicle oriented-collision remains a listed polish
item, not a defect.

## Phase D — Dhanmondi environment (COMPLETE)
NEW `src/game/world/buildings.ts`: modular building generator — textured
facade bodies (4 styles), window grids on all faces with per-floor
staggering, balconies on alternate floors, storefront glass bands, doors,
roof parapets, brick boundary walls (Dhanmondi signature). Windows,
balconies, and trims are instanced ACROSS ALL BUILDINGS — 3 element draw
calls total regardless of building count.
`builder.ts` upgraded: curbs added to sidewalks; lane strips merged into
one mesh (audit A11 — was ~58 draws, now 1); disposal scoped per build
(fixed a module-level state bug found in self-review).

## Phase E — PBR materials and lighting (COMPLETE)
NEW `src/game/world/textures.ts`: procedural PBR texture generator —
canvas-based base color + roughness maps for asphalt (grain + cracks),
concrete (paving seams), plaster (weather streaks), brick (running
bond). Deterministic seeds, cached, sRGB color spaces for maps, linear
for roughness. Zero external assets — original by construction.
`materials.ts` upgraded: map+roughnessMap on road/sidewalk/facade/roof/
boundary materials, per-style facade tints, window glass with metalness,
new trim + boundary materials. Engine: ACES filmic tone mapping — filmic
response with NO fake bloom (Task 4 requirement).

## Phase F — Optimization + monitoring (COMPLETE)
NEW `src/game/core/perf.ts`: real renderer.info sampler (draw calls,
triangles, points, GPU geometries/textures, shader programs, JS heap via
performance.memory where supported, 2 Hz, outside React).
NEW `src/components/game/DevPanel.tsx`: F3 toggles an in-game panel
showing every real metric; unsupported metrics labeled "not supported by
this browser" — never faked. Engine loop feeds frame-time samples.

## What this fixes for production
- "0 FPS / engine booting" chain (A1/A2/A3/A4) — startup gate + watchdog
- Draw calls: buildings now ~8 facade draws + 3 element instanced draws
  (was ~300+); lane strips 1 (was ~58)
- Visuals: textured PBR surfaces, varied modular architecture, filmic
  lighting

## Remaining (honest)
- CI workflow file still blocked (GitHub token lacks `workflow` scope —
  add the 12-line typecheck.yml manually, plan in AUDIT_REPORT.md)
- Real OSM tile (public/world/dhanmondi.json) still needs one
  `npm run fetch:world` run + commit for geographic accuracy; PREVIEW
  layout remains clearly labeled until then
- Before/after performance measurements on the SAME device pending
  (Task 11) — deploy this branch, open F3, record baseline numbers
- WebGPU path, streaming polish, mobile viewport testing — later phases

## Deploy
Branch `audit-upgrade` is deployable as-is: Vercel → project → set
production branch to `audit-upgrade`, or merge into `phase-1`.
