# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**v0.6.0 — production persistence + all-64-district baking.** Original IP.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Bake real OpenStreetMap data:

```bash
npm run fetch:world                  # Dhanmondi, Dhaka
npm run fetch:district -- chattogram # one major district
npm run fetch:all                    # ALL 64 districts (~15-25 min)
```

## Production setup (persistent accounts + cloud saves)

```bash
npm install pg            # optional peer dependency
export DATABASE_URL=postgres://...
npm run db:schema         # create tables
npm run start             # accounts + saves now survive restarts
```

Without `DATABASE_URL` the game runs with in-memory dev stores (reset on
restart) — everything else works identically.

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

## What's in the game (v0.6.0)

- Third-person character: walk, run, jump, swim, footsteps
- 5 drivable vehicles with distinct physics and audio: car, CNG
  auto-rickshaw, rickshaw, motorcycle, local bus
- 9 enterable shops with interiors
- Pedestrians, traffic AI, traffic lights cars obey
- Weather: clear → cloudy → rain → heavy rain → thunderstorm
- Day/night cycle, minimap, live graphics settings, adaptive resolution
- Bangladesh map: travel to any of the 64 districts, staged async loading
- Accounts at /login + cloud saves (server-authoritative, Postgres-ready)
- All audio 100% procedural (WebAudio — zero licensed assets)

## Security

scrypt password hashing, sha256-hashed session tokens in httpOnly cookies,
per-endpoint rate limiting, server-side save validation, ownership derived
from the session, parameterized SQL everywhere.

## Attribution

World data uses (c) OpenStreetMap contributors data, licensed ODbL 1.0.
Baked tiles carry this attribution. Preview layouts are original artistic
content, clearly labeled in-game — never presented as real map data.

## Status

Phases 1-8 complete + deepening backlog items #1 (Postgres persistence)
and #3 (all-64 baking) done. Remaining backlog in ROADMAP.md: WebGPU
renderer, multiplayer, worker tile decode, password recovery.
