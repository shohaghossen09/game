# Bangladesh Life Simulator

Open-world life simulation of Bangladesh, playable in the browser.
**v0.4.0 — accounts + cloud saves.** Original IP.

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

## What's in the game (v0.4.0)

- Third-person character: walk, run, jump, swim (underwater fog), footsteps
- 5 drivable vehicles: private car, CNG auto-rickshaw, rickshaw, motorcycle,
  local bus — distinct physics per category, speed-pitched engine audio
- 9 enterable shops with interiors
- Living world: pedestrians, traffic AI, traffic lights
- Weather: clear → cloudy → rain → heavy rain → thunderstorm
- Day/night cycle, minimap, live graphics settings
- **Bangladesh map: travel to any of the 64 districts**
- **Accounts: register/sign in at /login** — scrypt hashing, httpOnly session
  cookies, rate limiting
- **Cloud saves: 3 slots, server-authoritative when signed in; local
  localStorage saves otherwise (both kept)**
- All audio 100% procedural (WebAudio — zero licensed assets)

## Security notes

- Passwords: scrypt with per-user salt, constant-time verification
- Sessions: 32-byte tokens, stored sha256-hashed, httpOnly + SameSite cookies
- Saves: server validates shape/size and derives the owner from the session —
  never from client claims
- Rate limiting on register, login, and save endpoints

## Attribution

World data pipeline uses (c) OpenStreetMap contributors data, licensed
ODbL 1.0. Baked tiles carry this attribution. Preview layouts are original
artistic content, labeled as such in-game.

## Status

Phases 1-7 complete. Dev stores are in-memory (reset on restart); Postgres
adapters are the production persistence task. See DEVELOPMENT_STATUS.md and
ROADMAP.md.
