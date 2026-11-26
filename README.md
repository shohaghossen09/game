# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**Playable: Dhanmondi, Dhaka — v0.2.0.** Original IP.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Recommended — bake real OpenStreetMap data for the playable tile:

```bash
npm run fetch:world   # writes public/world/dhanmondi.json (internet needed, ~30s)
```

Until that runs, the game loads a clearly labeled **PREVIEW** layout that is
NOT real map data.

## Controls

| Input | Action |
|---|---|
| W A S D / arrows | Move |
| Shift | Run |
| Space | Jump |
| E | Enter / exit nearest vehicle |
| Esc | Pause menu |
| Mouse drag | Camera look |
| Touch joystick + RUN/JUMP/E buttons | Mobile (auto-detected) |

## What's in the game

- Third-person character: walk, run, jump, swim (with underwater fog)
- 5 drivable Bangladeshi vehicles: private car, CNG auto-rickshaw, rickshaw,
  motorcycle, local bus — each with distinct physics
- Living world: pedestrians walking sidewalks, traffic driving the road graph
- Weather: clear, cloudy, rain, heavy rain, thunderstorm — rain particles,
  slippery roads, reduced visibility, thunder flashes
- Day/night cycle (~5 min), minimap, pause menu with live graphics settings
- Quality profiles Low/Medium/High/Ultra (render scale, shadows, fog, NPC counts)

## Attribution

World data pipeline uses (c) OpenStreetMap contributors data, licensed ODbL 1.0.
The preview layout is original artistic content, labeled as such in-game.

## Status

Phases 1-5 complete. See DEVELOPMENT_STATUS.md for the honest list of what
works and what does not, and ROADMAP.md for what comes next
(interiors, audio, saves, 64 districts).
