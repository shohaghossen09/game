# Performance

## Budgets (targets, not promises)
- CPU: < 8 ms/frame simulation on mid-range desktop
- Draw calls: < 350 for the tile (instancing keeps vegetation at 2 calls)
- RAM: scene + physics under 400 MB
- Initial download: small; the Three.js engine chunk is lazy-loaded via
  dynamic import, the loading screen covers init

## Techniques in this build
- Instanced trees and street lamps (2 + 1 draw calls for all vegetation/street furniture)
- Shared materials (one per category, never per-object)
- Spatial-grid collision queries (only nearby AABBs tested per frame)
- Exponential damping camera (no per-frame allocations in the hot loop)
- Fog + far plane bound draw distance by profile
- Pixel ratio capped: 2 (High/Ultra), 1.5 (Medium/Low)
- Throttled HUD updates (speed at 10 Hz, FPS/clock at 2 Hz)

## Not yet implemented
- Occlusion culling, texture compression (Phase 8)
- Workers for tile decode (Phase 6)
- WebGPU renderer (Phase 8)
- Adaptive resolution scaling (Phase 8)

## FPS honesty
No fixed FPS is promised without on-hardware testing. Use the quality
profiles: Low targets mid-range mobile, High/Ultra target desktop.
