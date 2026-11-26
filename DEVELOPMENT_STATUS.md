# Development Status — v0.4.0 (Phases 1-7)

## Implemented and committed
- Everything in v0.3.0: engine, world, player, physics, 5 vehicles, water/swim,
  weather, pedestrians, traffic AI + lights, minimap, interiors, procedural
  audio, 64-district travel, district baker
- **Accounts (Phase 7)**: registration + login + logout with scrypt password
  hashing (per-user salt, constant-time compare), 32-byte session tokens
  stored sha256-hashed, httpOnly cookies (secure in production), no account
  enumeration on login failure, input validation (username 3-20 chars,
  password 8-128), per-IP rate limiting (register 5/h, login 10/10min)
- **Cloud saves (Phase 7)**: server-authoritative — GET/PUT /api/saves with
  session auth, per-user 3 slots, payload shape + size validation (64 KB cap),
  server re-derives the owning user from the session (never trusts client
  claims). Client falls back to localStorage offline; both copies kept on save
- **Auth UI (Phase 7)**: /login page (login/register toggle), pause menu shows
  signed-in state, sign in/out buttons, save/load labels show Cloud vs Local

## Store note (honest)
Dev uses in-memory stores — they reset on server restart. The AuthStore and
SaveStore interfaces are the production contracts; a Postgres/PostGIS adapter
implementing them is the remaining production task (schema + adapter, no
route changes needed).

## Not yet implemented
- Postgres/PostGIS adapters for the stores (production persistence)
- Password recovery (email/sender infra required)
- WebGPU renderer (Phase 8)
- Multiplayer / WebSockets
- Seamless streaming transitions (travel still rebuilds, ~200ms)

## Known issues
- Same as v0.3.0 (see git history): travel hitch, fixed interior slots,
  O(edges) NPC re-picking
- In-memory stores mean dev accounts don't survive restarts (expected for dev)

## Next tasks
1. Postgres adapter for AuthStore + SaveStore (production persistence)
2. Phase 8: async chunked travel, adaptive resolution, occlusion tuning
3. Password recovery flow (needs email sender)
