# Game Systems

## Player
- Walk 4.4 m/s, run 7.6 m/s, jump 9 m/s initial, gravity 24 m/s^2 (game-tuned)
- Capsule radius 0.42 m, height 1.75 m
- Movement is camera-relative; character turns toward the movement direction
- Articulated limb swing proportional to actual speed
- Swimming: buoyancy near water surface in water zones

## Camera
- Third-person follow, exponential damping (frame-rate independent)
- Mouse-drag orbit (yaw/pitch); pitch clamped -1.1..0.5
- Auto-aligns behind the car while driving; distance grows with speed

## Vehicle
- Arcade model: throttle/brake, drag, speed-scaled steering (no turning while stopped)
- Max forward 26 m/s (~94 km/h), reverse 9 m/s
- Collides against building AABBs with 65% speed loss per impact
- Enter/exit within 4.5 m via E key or mobile E button

## World
- Single static tile in Phase 1 (streaming arrives Phase 6)
- Day length 300 s; sun elevation drives light intensity, color, sky/fog color

## Quality profiles
| Profile | Render scale | Shadows | Fog far | Trees |
|---|---|---|---|---|
| Low | 0.5x | 512 | 240 m | 40 |
| Medium | 0.75x | 1024 | 320 m | 70 |
| High | 1.0x | 2048 | 400 m | 100 |
| Ultra | 1.0x | 4096 | 500 m | 140 |

## Input
- Unified snapshot: keyboard + mouse + touch merged before simulation
- Edge-triggered: jump queue, action (E); held: movement, run
