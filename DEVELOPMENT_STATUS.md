# Development Status — v0.5.0 (Phases 1-8)

## Implemented and committed
- Everything in v0.4.0: engine, world, player, physics, 5 vehicles, water/swim,
  weather, pedestrians, traffic AI + lights, interiors, procedural audio,
  64-district travel, district baker, accounts, cloud saves
- **Adaptive resolution (Phase 8)**: rolling FPS average drives a dynamic
  render-scale factor (0.6-1.0, 0.05 steps, 1.2s cooldown) — drops render
  cost when frames fall, recovers when there is headroom; resets on quality
  change and travel
- **Staged async travel (Phase 8)**: district rebuilds now run one step per
  frame with the loading overlay — the 200ms freeze is gone; system swap is
  atomic in the final step; travel requests are guarded against re-entry
- **WebGPU detector (Phase 8)**: capability probe (navigator.gpu + adapter
  request) shown in status; renderer stays WebGL2 until the three.js
  WebGPURenderer is proven for this scene profile — stability over effects
- **Docs**: TESTING.md expanded to an 18-point regression matrix incl. the
  adaptive-resolution CPU throttle test and double-travel regression

## Not yet implemented (honest)
- WebGPU renderer integration (detector only in this release)
- Postgres adapters for AuthStore/SaveStore (dev = in-memory stores)
- Password recovery (email sender infra)
- Multiplayer (WebSockets, later phase)
- Worker-based tile decode + binary tile format
- Occlusion culling beyond frustum defaults

## Known issues
- Traffic cars can overlap at sharp intersections (proximity-based only)
- Fixed interior slots vs real OSM footprints (baker pass pending)
- NPC edge re-picking O(edges) — imperceptible at current counts

## Project shape
~60 files, 80+ commits, branches: phase-1..phase-8, release-v03, release-v04.
All 8 original roadmap phases have shipped a first implementation; remaining
work is deepening (listed above), not greenfield.
