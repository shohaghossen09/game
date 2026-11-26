# Development Status — v0.2.0 (audit-upgrade branch, Phases A+B)

## Phase A — Audit (COMPLETE)
Full source read of the deployed `phase-1` tree; findings in AUDIT_REPORT.md.
Headline confirmed issues:
- A1 (CRITICAL): loading screen declared Ready before first render
- A2 (CRITICAL): WebGL context loss unhandled — silent 0-FPS death
- A3 (HIGH): boot yields via rAF only — stalls forever in throttled tabs
- A4 (HIGH): no WebGL capability probe — misleading failure messages
- A6 (MEDIUM): no baked world tile on production — PREVIEW layout runs
- A10 (LOW): per-frame HUD re-renders without equality guard
- Cleared: Rapier is not installed (prompt assumed it); physics grid is
  sound; strict TS was on (the deploy-breaking bug was a missing CI gate,
  not a config issue)

## Phase B — Startup hardening (COMPLETE)
- `src/game/core/webglDetect.ts` (NEW): capability probe webgl2→webgl,
  driver-alive check via parameter query, categorized human messages
- `src/game/core/engine.ts`: first-frame gate — Ready only after a render
  call completes; 20s boot watchdog with real error category; rAF-or-50ms
  -timeout boot yields (background-tab safe); context-lost/restored
  handling (sim pauses, HUD shows recovery, resumes on restore); render
  try/catch with categorization; FPS counts confirmed renders only
- `src/game/core/store.ts`: honest boot phases, setHud equality guard
- `src/components/game/GameClient.tsx`: Retry button on boot failure
- `src/app/globals.css`: retry/error-box styles

## Not yet done (honest)
- `.github/workflows/typecheck.yml` commit BLOCKED: the connected GitHub
  token lacks the `workflow` scope, so commits touching `.github/workflows`
  are rejected. **Action needed from you:** either grant the workflow
  scope to the Ashna connector token, or add the file manually with the
  content from the workflow plan in AUDIT_REPORT.md Phase B plan.
- Runtime verification of the live deployment (browser-control extension
  not paired this session; Vercel connector not connected). Deploy
  `audit-upgrade` and check: boot completes on production, FPS counter
  moves, background-tab boot no longer stalls.
- Phase C+ (rendering/physics polish, Dhanmondi environment, PBR,
  optimization, dev panel, streaming, testing) — not started yet.

## Deploy note
The `audit-upgrade` branch includes the earlier rAF-promise fix and the
next 14.2.35 security bump already on `phase-1`. To test the startup
fixes on production: point the Vercel project at `audit-upgrade` (or
merge it into `phase-1` and redeploy).
