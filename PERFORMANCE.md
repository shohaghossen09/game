# Performance — v0.5.0

## Budgets (targets, not promises)
- CPU: < 8 ms/frame simulation on mid-range desktop
- Draw calls: < 350 for the tile
- RAM: scene + physics under 400 MB
- Frame target: 60 fps desktop High; Low profile targets mid-range mobile

## Adaptive resolution (new in Phase 8)
- Rolling 6-sample FPS average, checked every 0.5 s
- Scale steps 0.05 within 0.6..1.0, 1.2 s cooldown between changes
- Scales up at avg >= 58 fps, down at avg <= 45 fps
- Resets on quality change and after district travel
- Multiplies the quality profile's pixel-ratio cap — never exceeds it

## Techniques in the build
- Instanced: trees (2 calls), lamps (1), pedestrians (2), traffic (2),
  bins (1) — population size does not affect draw call count
- Shared materials per category, never per-object
- Spatial-grid collision queries (nearby AABBs only)
- No per-frame allocations in the camera/AI hot paths
- Fog + far plane bound draw distance by profile
- Staged async district travel — rebuild steps yield frames; no 200 ms hitch
- HUD throttled (speed 10 Hz, FPS/clock 2 Hz)
- Dynamic import for the engine bundle; loading screen covers init

## Measured (indicative, single mid-range desktop, High profile)
- ~60 fps steady in Dhanmondi PREVIEW; adaptive scale holds 1.0
- Storm + full traffic + NPCs: ~55-60 fps, scale dips to 0.95 at worst
- No fixed FPS is promised without on-hardware testing — verify with the
  profiles and the DevTools CPU throttle test (TESTING.md #15)

## Not yet implemented
- WebGPU renderer path (detector ships in v0.5.0; renderer integration is
  gated on three.js WebGPURenderer stability for this scene profile)
- Occlusion culling beyond Three.js frustum culling
- Worker-based tile decode (streaming is fetch + staged main-thread build;
  workers land with the binary tile format)
- Texture compression (no external textures yet — all geometry is procedural)
