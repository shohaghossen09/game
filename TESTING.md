# Testing

## Automated
- `npm run typecheck` — strict TS must be clean before every commit
- `npm run build` — must succeed before any milestone is called done

## Manual test matrix (run after each milestone)
1. Boot: loading screen completes with real progress; no console errors
2. Movement: walk/run/jump; character turns toward movement; limbs animate
3. Collision: walk into a building — blocked; jump on sidewalk — stands
4. Camera: mouse-drag orbits; pitch clamped; smooth follow at all speeds
5. Vehicle: E enters within 4.5 m; accelerate, brake, reverse; steer scales
   with speed; hit a building — speed drops; E exits beside the car
6. Swimming: walk into the pond — buoyancy near surface, no sinking
7. Day/night: full cycle ~5 min; sun, sky, fog, and clock all shift
8. HUD: location, clock, FPS, speed, prompt all render; PREVIEW warning
   shows only when the tile is the preview layout
9. Mobile (DevTools touch emulation or real device): joystick moves the
   character in camera space; RUN/JUMP/E buttons work; controls hidden
   on non-touch devices
10. `npm run fetch:world` then reboot — PREVIEW label disappears, road
    count matches the baked tile
11. Resize window mid-game — canvas and camera aspect update without errors

## Known failures (tracked in DEVELOPMENT_STATUS.md)
- Car ignores sidewalk colliders (accepted in v0.1.0)
- Camera building clip on fast 180-degree turns (rare)
