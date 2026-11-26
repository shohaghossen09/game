# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**v0.3.0 — 64-district travel enabled.** Original IP.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Bake real OpenStreetMap data (any of these, internet needed):

```bash
npm run fetch:world                  # Dhanmondi, Dhaka
npm run fetch:district -- chattogram # any major district
npm run fetch:district -- sylhet 3   # custom size in km
```

Districts without baked data load a clearly labeled **PREVIEW** layout —
never presented as real map data.

## Controls

| Input | Action |
|---|---|
| W A S D / arrows | Move |
| Shift | Run |
| Space | Jump |
| E | Enter / exit nearest vehicle |
| Esc | Pause → map, saves, settings |
| Mouse drag | Camera look |
| Touch joystick + RUN/JUMP/E buttons | Mobile (auto-detected) |

## What's in the game (v0.3.0)

- Third-person character: walk, run, jump, swim (underwater fog), footsteps
- 5 drivable vehicles: private car, CNG auto-rickshaw, rickshaw, motorcycle,
  local bus — distinct physics per category, speed-pitched engine audio
- 9 enterable shops with interiors: tea stall, grocery, mobile shop,
  pharmacy, restaurant
- Living world: pedestrians on sidewalks, traffic with car-following,
  traffic lights at intersections
- Weather: clear → cloudy → rain → heavy rain → thunderstorm — rain audio,
  slippery roads, reduced visibility, thunder flashes
- Day/night cycle, minimap, pause menu with live graphics settings
- **Bangladesh map: travel to any of the 64 districts** (baked = real OSM
  geometry; unbaked = labeled preview)
- Save/load: 3 slots (position, time, weather, district)
- All audio 100% procedural (WebAudio synthesis — zero licensed assets)

## Attribution

World data pipeline uses (c) OpenStreetMap contributors data, licensed
ODbL 1.0. Baked tiles carry this attribution. The preview layouts are
original artistic content, labeled as such in-game.

## Status

Phases 1-6 complete. See DEVELOPMENT_STATUS.md for the honest gap list and
ROADMAP.md for what's next (server backend, seamless streaming, WebGPU).
