# Game Systems

## Player
- Walk 4.4 m/s, run 7.6 m/s, jump 9 m/s, gravity 24 m/s^2 (game-tuned)
- Capsule radius 0.42 m, height 1.75 m; camera-relative movement
- Swim states: land -> wading -> swimming -> underwater; buoyancy springs the
  body toward float depth; underwater applies blue-tinted short fog

## Vehicles (5 categories, spec-driven)
| Category | Max speed | Accel | Steering | Seats |
|---|---|---|---|---|
| Private Car | 26 m/s | 14 | medium | 4 |
| CNG Auto-Rickshaw | 14 m/s | 9 | high | 3 |
| Rickshaw | 7 m/s | 5 | highest | 2 |
| Motorcycle | 24 m/s | 16 | high | 2 |
| Local Bus | 20 m/s | 7 | low (long wheelbase) | 40 |

- Nearest-vehicle targeting within 4.5 m, labeled prompt (Press E — Rickshaw)
- Wet-road grip scales acceleration, braking, and steering bite
- Collision: scaled AABB pushout per vehicle footprint, 65% speed loss per hit

## Weather (state machine)
clear (120s) -> cloudy (60s) -> rain (90s) -> heavyRain (60s) -> thunderstorm (45s) -> clear
- Intensity eases toward the target (no hard cuts)
- Rain: GPU Points cloud (max 2400), draw-range scaled, follows camera
- Grip: 1.0 dry -> 0.7 at peak rain; Visibility: 1.0 -> 0.45
- Thunder: random ~4/min flashes during thunderstorm, 0.18s white sky boost

## Traffic AI
- Follows road segments (major + local), lane offset from centerline
- Car-following: slows to 80% of the car ahead within 7 m (proximity-based)
- Distance activation: full sim within 60 m, frozen/hidden beyond 130 m
- Instanced rendering: 2 draw calls regardless of count

## Pedestrian NPCs
- Walk the sidewalk network (road edges offset by width/2 + 1.4 m)
- Random edge re-picking on arrival (nearest-edge heuristic)
- Distance LOD: walk-bob animation within 40 m, plain placement to 90 m,
  frozen/hidden beyond 90 m
- Instanced rendering: 2 draw calls regardless of count

## Camera
- Damped follow; mouse-drag orbit (pitch -1.1..0.5); behind-car alignment;
  distance grows with vehicle length and speed

## Day/Night
- 300 s full cycle; sun elevation drives light intensity/color, sky, fog color;
  clock readout in HUD

## Quality profiles
| Profile | Render scale | Shadows | Fog far | Trees | NPCs | Traffic |
|---|---|---|---|---|---|---|
| Low | 0.5x | 512 | 240 m | 40 | 20 | 12 |
| Medium | 0.75x | 1024 | 320 m | 70 | 40 | 20 |
| High | 1.0x | 2048 | 400 m | 100 | 60 | 28 |
| Ultra | 1.0x | 4096 | 500 m | 140 | 90 | 40 |

Profiles switch live from the pause menu (Esc).

## Input
- Unified snapshot: keyboard + mouse + touch merged before simulation
- Edge-triggered: jump, action (E), pause (Esc); held: movement, run
