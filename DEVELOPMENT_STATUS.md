# Development Status — v0.6.0

## Implemented and committed
- Everything in v0.5.0 (Phases 1-8: full game, accounts, cloud saves,
  adaptive resolution, staged async travel)
- **Postgres production persistence**: `db/schema.sql` (users, sessions,
  saves — constraints + indexes) and `pg-adapters.ts` implementing the
  exact AuthStore/SaveStore interfaces. Activated by setting DATABASE_URL;
  falls back to in-memory dev stores. `pg` is an optional peer dependency —
  the import is lazy so it never enters the bundle without a DB.
- **Persistence-agnostic routes**: all 5 API routes now `await stores()` —
  zero route logic changed, only the store resolution seam.
- **All-64-district baker**: `npm run fetch:all` bakes every district in
  the registry sequentially with polite 3s pauses (Overpass rate limits),
  skip-existing caching, per-district failure isolation, exit code 2 if
  any fail. `npm run fetch:all chattogram 3` for a single re-bake.

## Production setup (with a real database)
1. `npm install pg` (optional peer — only needed for production)
2. `npm run db:schema` (needs DATABASE_URL set)
3. Set `DATABASE_URL` in the environment; restart
4. Accounts and cloud saves now persist across restarts

## Not yet implemented (honest)
- WebGPU renderer integration (detector only)
- Multiplayer (WebSockets)
- Password recovery (email infra)
- Worker tile decode + binary tile format
- Interiors merged with real OSM footprints (baker pass)

## Known issues
- Unchanged from v0.5.0: traffic overlap at sharp intersections, fixed
  interior slots, O(edges) NPC re-picking
- fetch:all takes ~15-25 minutes for all 64 (Overpass politeness) —
  intended; per-district output files make failures resumable
