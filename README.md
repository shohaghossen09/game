# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**v0.5.0 — all 8 roadmap phases shipped.** Original IP.

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
| Esc | Pause → map, saves, account, settings |
| Mouse drag | Camera look |
| Touch joystick + RUN/JUMP/E buttons | Mobile (auto-detected) |

## What's in the game (v0.5.0)

- Third-person character: walk, run, jump, swim (underwater fog), footsteps
- 5 drivable vehicles with distinct physics and per-category engine audio:
  private car, CNG auto-rickshaw, rickshaw, motorcycle, local bus
- 9 enterable shops with interiors (tea stall, grocery, mobile shop,
  pharmacy, restaurant)
- Living world: pedestrians, traffic AI, traffic lights with car obedience
- Weather: clear → cloudy → rain → heavy rain → thunderstorm — rain audio,
  slippery roads, reduced visibility, thunder flashes
- Day/night cycle, minimap, live graphics settings
- Bangladesh map: travel to any of the 64 districts (staged async loading —
  no freeze)
- Accounts at /login + server-authoritative cloud saves (3 slots; local
  fallback offline)
- Adaptive resolution: render scale auto-tunes to hold 60 fps
- All audio 100% procedural (WebAudio — zero licensed assets)

## Security

scrypt password hashing (per-user salt, constant-time verify), sha256-hashed
session tokens in httpOnly cookies, per-endpoint rate limiting, server-side
save validation with ownership derived from the session.

## Attribution

World data pipeline uses (c) OpenStreetMap contributors data, licensed
ODbL 1.0. Baked tiles carry this attribution. Preview layouts are original
artistic content, labeled as such in-game.

## Status

All 8 phases complete (v0.5.0). The deepening backlog — Postgres adapters,
WebGPU renderer, baking all 64 districts, multiplayer — is in ROADMAP.md.
See DEVELOPMENT_STATUS.md for the honest gap list.
