# Architecture

## Principle
The engine is imperative TypeScript. React renders the shell (canvas, HUD) only.
Per-frame game state never flows through React state; the HUD reads throttled
snapshots from the Zustand store (~2-10 Hz), avoiding per-frame re-renders.

React Three Fiber is intentionally not used in Phase 1: with a single canvas
and an imperative engine, R3F adds reconciliation overhead without benefit here.
It may be introduced later for menu scenes if needed.

## Modules

| Module | Responsibility |
|---|---|
| `src/game/core/engine.ts` | Lifecycle: init chain, render loop, day/night, dispose |
| `src/game/core/input.ts` | Unified keyboard/mouse/touch input snapshot |
| `src/game/core/store.ts` | Zustand store for UI-facing state (HUD, progress) |
| `src/game/physics/collision.ts` | AABB world, capsule/car resolution, spatial grid |
| `src/game/player/player.ts` | Articulated character + movement/animation |
| `src/game/vehicle/vehicle.ts` | Drivable car + collision response |
| `src/game/world/builder.ts` | Tile geometry + colliders + instancing |
| `src/game/world/dhakaTile.ts` | Tile schema + labeled PREVIEW layout |
| `src/game/world/materials.ts` | Shared PBR materials |
| `src/components/game/*` | React shell: GameClient, Hud, TouchControls |
| `scripts/fetch-dhaka.mjs` | Overpass -> tile JSON baker |

## Data flow

OSM (Overpass API) -> `fetch-dhaka.mjs` -> `public/world/dhanmondi.json`
(roads/buildings/water in meters, origin at tile center)
-> `builder.ts` -> Three.js meshes + static AABB colliders.

If the JSON is missing, `dhakaTile.ts` returns a deterministic PREVIEW layout
and the HUD shows `PREVIEW LAYOUT - NOT MAP DATA`.

## Physics note
Phase 1 uses a purpose-built capsule-vs-AABB engine (deterministic, cheap,
proven in the standalone prototype). A Rapier 3D swap behind the same
`CollisionWorld` interface is a Phase 2 task — the interface was designed for it.

## Rendering
WebGL2 via Three.js WebGLRenderer, sRGB output, PCF soft shadows, instanced
trees/lamps, fog. WebGPU renderer is a Phase 8 item behind a feature detect.

## Quality profiles
Config-driven (render scale, shadow map size, fog far, tree count, pixel ratio
cap). Stored in `engine.ts` QUALITY map; runtime switching arrives with the
settings menu in Phase 2.
