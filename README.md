# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**Phase 1: Dhanmondi, Dhaka.** Original IP — inspired by open-world driving
games but built from scratch with original code, geometry, and data pipelines.

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
| E | Enter / exit vehicle |
| Mouse drag | Camera look |
| Touch joystick + RUN/JUMP/E buttons | Mobile (auto-detected) |

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm start` — production
- `npm run typecheck` — strict TypeScript check
- `npm run fetch:world` — bake real OSM world data

## Attribution

World data pipeline uses (c) OpenStreetMap contributors data, licensed ODbL 1.0.
The preview layout is original artistic content, labeled as such in-game.
All game code and art are original IP.

## Status

Phase 1 complete. See DEVELOPMENT_STATUS.md for the honest list of what works
and what does not, and ROADMAP.md for the phase plan (Dhaka -> 64 districts).
