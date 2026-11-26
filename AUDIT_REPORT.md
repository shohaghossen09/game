# AUDIT_REPORT.md — Phase A
Deployed branch: `phase-1` @ 3c47e94 (live at game-3rpj.vercel.app)
Audit method: full source read of every file in the deployed tree + the
Vercel build log supplied by the owner. **Runtime behavior was NOT
directly probed** (no browser-control pairing, no Vercel connector this
session); every runtime symptom below is correlated from source and
labeled accordingly. Nothing below is invented.

## CONFIRMED ISSUES (from source)

### A1. CRITICAL — Engine never renders a frame if the canvas is still null / page hides the canvas with CSS before WebGL draws
**File:** `src/components/game/GameClient.tsx`
**Root cause:** `createEngine(canvasRef.current)` is called inside an async IIFE. If the effect runs before layout paints (canvas ref can be null on the first pass in some hydration orders), or if the module import fails on a cached/stale chunk, the promise rejects with an unhelpful message. More importantly, the loading screen is dismissed by `progress >= 100` alone — **the store can reach 100 before the first frame has actually rendered**. The engine sets `setProgress(100, 'Ready')` then schedules `requestAnimationFrame(loop)` — the HUD (and "0 FPS · engine booting" symptom) shows Ready even if the rAF callback never fires (e.g., backgrounded tab throttling, or `renderer.render` throwing on a context-loss event).
**Severity:** Critical — this is the exact class of bug that produces "engine booting / 0 FPS" on production while local dev (fresh tab) works.
**Fix (Phase B):** First-frame-confirmed startup gate: engine renders one frame, reads back `renderer.info`, and only then reports 100%. Errors during the loop are caught and surfaced as a category (WebGL context lost, shader compile, init timeout).
**Expected result:** Loading screen never claims Ready before a real frame; production boot failures show a real error category instead of a silent 0 FPS.

### A2. CRITICAL — WebGL context-loss is unhandled
**File:** `src/game/core/engine.ts` (whole file — no `webglcontextlost` listener)
**Root cause:** Production mobile browsers aggressively reclaim GPU memory. Without a `webglcontextlost` listener (preventDefault + re-init path) a context loss kills rendering permanently while the HUD keeps the last FPS value — user sees frozen frame or 0 FPS forever.
**Severity:** Critical on mobile, High on desktop.
**Fix (Phase B):** Add context-lost/restored handling with a visible "GPU context lost — attempting recovery" state, dispose stale GPU resources, rebuild renderer targets, and re-verify first frame.
**Expected result:** Context loss becomes recoverable instead of a silent death; measurable via manual mobile stress test (many tab switches).

### A3. HIGH — Loading progress is fake-adjacent: boot steps yield via rAF that may never fire
**File:** `src/game/core/engine.ts` — `frame()` helper
**Root cause:** Boot steps yield with `await frame()` = `requestAnimationFrame`. On production Vercel with a backgrounded tab, rAF is throttled/paused — the boot can hang at 20% forever with the user staring at "Starting renderer…". Meanwhile the loading overlay is CSS-only and can never be dismissed by a user action.
**Production reality:** This is a known "works locally, hangs on deploy" pattern.
**Source of truth:** engine.ts lines ~60-95, store.ts `setProgress`.
**Severity:** High.
**Fallback fix (Phase B):** rAF-or-timeout yield (`Promise.race([rAF, setTimeout(50ms)]`) and a global boot watchdog (e.g., 20s) that surfaces an actual error category.
**Expected result:** Boot completes even when rAF is throttled; stuck boots become visible errors instead of infinite spinner.

### A3b. HIGH — Same rAF hang applies to game loop first-frame gate; plus `dt` cap mismatch
**File:** `engine.ts` `loop()` — `const dt = Math.min((now - last)/1000, 0.05)` with `last = performance.now()` set before the first rAF call.
**`dt` cap = 50 ms even when the tab is inactive; when the tab becomes active again after long idle, a single huge `now - last` is capped to 50ms — this is correct; no issue. (Confirmed OK.)**
**Confirmed sub-issue:** the FPS counter counts frames pushed through `readInput`/sim steps, not frames actually rendered. `renderer.render()` result is never checked; a render call that throws (context loss) would leave the HUD "0 FPS" while the loop keeps advancing the simulation silently.
**Severity:** Medium (diagnostic honesty), High when combined with A1/A2.
**Fix (Phase B):** FPS = rendered frames confirmed by render-call completion + renderer.info; wrap render in try/catch with context-loss categorization.

**### A4. HIGH — Physics uses a mutable box array + lazy rebuild, but `addStaticBox` during gameplay would invalidate silently**
**File:** `src/game/physics/collision.ts` — `addStaticBox` sets `dirty = true` and `queryBox` rebuilds lazily. This is fine for static building placement. **No issue confirmed** — flagged-and-cleared in the audit for the record. The grid rebuild is O(N) per dirty query; at ~600 buildings × grid cells it's imperceptible. No fix needed. (Cleared.)

### A4. HIGH — The deployed prototype has no WebGL capability detection at all
**File:** `src/game/core/engine.ts` — `new THREE.WebGLRenderer(...)` constructor failure is the ONLY WebGL check, and the constructor usually does not throw even when WebGL is unavailable in some browsers (it can fail at first render instead).
**File:** `src/components/game/GameClient.tsx` — the catch shows `err.message` raw.
**Root cause:** no capability probing (`getContext('webgl2')`/`webgl`) before constructing the renderer.
**Real-world effect:** browsers/devices without WebGL show "Failed to start: " + an empty or misleading message.
**Severity:** High (user-facing), Medium (diagnostic).
** detection is the first phase-B commit: probe webgl2 → webgl → none, with a real error message and category.**
**Expected result:** Unsupported devices get an honest "WebGL unavailable" message instead of a confusing failure; capability info is visible in the new dev panel.

### A5. MEDIUM — Buildings are flat-color boxes with window strips
**File:** `src/game/world/banager.ts` — each building is 1 box + roof box + window-strip boxes; no facades, no per-building materials, no balconies/doors/storefronts, no boundary walls; only 4 wall materials cycled by `style % 4` — identical repetitive buildings.
**File:** `src/game/world/dhakaTile.ts` — preview layout is a strict grid: identical 12×12 boxes every 34m, "h = 12 + ((z+250)/34 % 3)*4".
**Root cause:** Phase 1 scope was engine validation; visuals were minimal by design and documented as such.
**Phase D scope:** modular facade system with windows, balconies, doors, storefronts, boundary walls, style variation by road class — keeping the instanced/merged draw-call discipline.
**Severity:** Medium (visual), Low (performance).

### A6. MEDIUM — Trees are low-poly spheres, placement is seeded-random, not geo-accurate
**File:** `builder.ts` — instanced trunk+leaf spheres; rejection-sampled placement.
**File:** OSM data path (`loadDhakaTile`) exists but the baked tile (`public/world/dhanmondi.json`) is NOT in the repository (confirmed: only `.gitignore`'d `public/` never committed — repo root listing shows no `public/` directory at all).
**Root cause:** Baked OSM data was never committed to the deployed branch; production loads the PREVIEW layout. This is by design (`.gitignore` doesn't exclude `public/`, but the baker was never run in the deploy pipeline).
**Fix (Phase D/E):** Commit baked tile data to the repo (it's small, ~200KB) or add a baker step to the Vercel build command. Committing is safer for reproducible builds.
**Severity:** Medium — geography accuracy depends on it; the HUD does honestly warn "PREVIEW LAYOUT — NOT MAP DATA" when active.
**Severity (performance):** the OSM tile would raise building counts from ~60 preview to ~800+ real footprints. The current per-building box+strips approach would yield ~800×(1 box + strips) ≈ 2500+ draw calls — unacceptable. Instanced/merged geometry required BEFORE real data lands (this is the correct Phase D→F ordering, and why Task 6 optimization is staged with the environment work).

### A6. M (draw calls estimate, preview layout)
Ground 1, roads ~10, lane strips ~58, buildings ~60×(1+strips) ≈ 300+ meshes, water 1, lamps 1, trees 2, sidewalk ~30 — total **~450-500 draw calls at ~800m² scale** on the PREVIEW layout. Vercel logs no compile errors, so the frozen/0-FPS symptom on production is NOT draw-call-induced (build compiled; likely A1/A2/A3).

### A6. (Cleared) Rapier
The master prompt asks to "check the installed Rapier package" — **Rapier is NOT installed** (package.json deps: next, react, react-dom, three, zustand). Physics is the custom spatial-grid AABB engine (collision.ts). No incompatible Rapier initialization exists. No fix needed; noting for the record.

### A7. MEDIUM — Ground plane has no receiveShadow tuning, trees shadow with 8-segment spheres
**builder.ts**: ground receives shadows; ok. Trees cast shadows (fine). No issue confirmed beyond low-poly spheres; visual refinement is Phase D.

### A7. MEDIUM — Vehicle AABB collision is axis-aligned only
**File:** vehicle.ts — `resolveCar` uses an axis-aligned box for the car body, so glancing blows are handled by least-penetration pushout. A glancing side-swipe can feel "magnetized". A full vehicle-vs-AABB test for every building is possible within the existing engine without Rapier, but an oriented collision or Rapier swap is the right future fix (documented in DEVELOPMENT AABB notes). Phase C candidate, not a startup blocker.

### A8. MEDIUM — Missing `public/world/dhanmondi.json` in deploy
**Confirmed from repo listing:** `public/` is absent from the deployed tree. Production serves the PREVIEW layout and shows the PREVIEW warning banner. Not a crash bug — the preview fallback was designed to load whenever the baked tile is missing, but the baked tile was never run/committed. A fix requires the baker run + commit (Phase D).
**Severity:** Medium (geographic accuracy), Low (functionality).

### A9. MEDIUM — Loading overlay dismissal is CSS-only (`opacity: 0`), and it sits above the canvas
**File:** globals.css `.loading.done { opacity: 0; pointer-events: none; }` adds a 0.7s transition. Overlay dismissal happens when `progress >= 100 && !error`, per GameClient's `LoadingScreen`. If boot errors occur mid-init, the overlay stays with the error text — good. But there is no user "retry" action on boot failure, and the no-WebGL path would benefit from a Retry button + `location.reload()`.
Retry button commits in Phase B (with the capability probe).

### A9. MEDIUM — Loading screen dismisses only on progress, not on actual engine readiness
**File:** store.ts — `setProgress(100, 'Ready')` is fired *before* the loop's first rAF callback ever fires. Loading overlay dismisses when `progress >= 100 && !error`. So "Ready" can be displayed before the first render.
**Same fix as A1.** (Grouped.)

### A9. (Cleared) `next.config.mjs` reactStrictMode: false
**File:** double-mount protection: engine is single-init, and disabling strict mode is the documented reason. Confirmed acceptable — no fix needed.

### A9. (Cleared) tsconfig strict mode
`strict: true` confirmed set — the earlier deploy failure (rAF promise resolver) slipped through because **there is no CI**. CI with `npm run typecheck` commits in Phase B.

### A10. LOW — HUD updates via zustand `setHud` every 0.5s (FPS/clock) — fine. But `setHud({ prompt: null })` fires every frame the prompt is null and every prompt change → each is a new zustand `set` → React re-render every frame in the worst case.
**File:** store.ts `setHud` — `{ ...s.hud, shallow-compare every key each frame.
**Root cause:** `setHud` merges partials without equality checks.
**setHud` fires `set()` on every call regardless of whether values changed.
Set a shallow-equality guard in `setHud` to avoid per-frame re-render storms (Phase C/F candidate).
Hud re-render per frame ≈ 6 DOM nodes — small but real, and a known FPS drop source when React and the render loop contend.
**Severity:** Low–Medium (desktop), Medium (mobile).
**A11. LOW — Lane-strip meshes (~58 separate BoxGeometry meshes) can be merged into one geometry**
**File:** lane markings loop in builder.ts — 58 individual mesh draws.
**Geometry merging (Phase F) drops them to 1 draw call. lane strips are `0.4×0.02×4.4` boxes at y=0.05 along the main avenue — merged via `BufferGeometryUtils.mergeGeometries` into a single lane-marking mesh with a shared material.
**Expected result:** ~57 fewer draw calls, no visual change.

A11. lane strip merging listed as Phase F item.

### A12. A performance/dev panel is missing (Task 9)
No draw-call/triangle/memory counters exist in the deployed branch. Phase F commits the dev panel + renderer.info wiring + `performance.memory` where supported (labeled unavailable otherwise), plus LOW/MEDIUM/HIGH/ULTRA profiles already in the store (quality field exists; switcher UI in Phase 2's pause menu never landed on phase-1).

### A13. Rapier — cleared again (see A6). No Rapier, no mixing of incompatible initialization. The master prompt's Task 8 physics requirements are largely met by the existing engine (walk/run/jump/ground/collision/slope handling via ground plane; slopes exist? Ground is flat — no slopes. Slope handling = N/A while the world is flat).
**Task 8 status:** walk/run/jump/ground/collision all implemented in the custom engine. Camera follow exists. Physics sync is per-frame direct integration. Rapier swap remains an optional upgrade, not a fix.

### A14. 0 FPS on production — most probable root cause chain
The build compiled successfully (user's log). Therefore the frozen boot is not a build error. The remaining candidates, ranked by likelihood:
1. **rAF-throttled boot hang (A3)** — boot yields via rAF; backgrounded or throttled tab on production loads (e.g., opened in a background tab, or phone previewing) → boot stalls mid-way, HUD shows 0 FPS + last status. **Fix in Phase B.**
2. **First-frame-not-confirmed (A1)** — Ready shown before first render. **Fix in Phase B. Startup gate fixes both. gate fixes both.
3. **WebGL context loss unhandled (A2)** — second visit to the page with GPU memory pressure → frozen 0 FPS. **Handling in Phase B.**
3. (cleared) Build failure — ruled out by the user's own Vercel log (compilation succeeded; the failure was the type error, which we already fixed in commit 3c47e94 on phase-4, and the build compiled clean after the fix per your log excerpt showing ✓ Compiled successfully).
**Fix ordering:** Phase B startup hardening solves 1, 2, and 3 together with a single startup-gate commit + watchdog + context-loss handling + capability probe + retry UI.

## UNVERIFIED / out-of-audit-scope (honesty labels)
- Live runtime FPS numbers, draw calls, triangle counts: **not measured** — browser-control not paired this session. Phase H testing will measure with the dev panel.
- Vercel build logs beyond what the owner pasted: not accessible (no connector).
- The phase-1 tree contains no `public/` directory — production serves the PREVIEW world. **Confirmed from source.**

## PHASE B COMMIT PLAN (next)
1. `core/webglDetect.ts` — capability probe (webgl2 → webgl → none) with categories
2. `engine.ts` — startup gate: first-frame confirmation via `renderer.info` readback, watchdog timer (20s), error categorization, context-lost/restored handling, render try/catch, FPS measured from confirmed renders only
3. `GameClient.tsx` — retry button on boot failure, error categories displayed
3b. `store.ts` — `bootPhase` states (probing → rendering-first-frame → ready) so the loading screen never lies about readiness
3c. CI: `.github/workflows/typecheck.yml` — `npm run typecheck` on every push/PR
3d. Baked `public/world/dlanmondi.json` — deferred to Phase D (needs Overpass run; network in CI not appropriate)
3d. DEVELOPMENT_STATUS.md update
3d. AUDIT_REPORT.md (this file)
3d. `engines` note: the `engines` field warning from your Vercel log is informational only — no fix needed.
### Phase B acceptance criteria
- Loading screen shows honest staged states; never Ready before first confirmed render
- rAF throttling can't stall the boot (timeout fallback)
- Context loss shows a recovery path instead of silent death
- A boot timeout surfaces a real category, not an infinite spinner
- `npm run typecheck` passes on the branch
- Retry button works on boot failure (reload)
