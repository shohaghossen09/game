-- Bangladesh Life Simulator — production persistence schema
-- Implements AuthStore + SaveStore on PostgreSQL.
-- Run once: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS bls_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL,
  username_lc   TEXT NOT NULL,                -- case-insensitive uniqueness
  pass_hash     TEXT NOT NULL,                -- scrypt salt:hash hex
  created_at    BIGINT NOT NULL,             -- epoch ms
  CONSTRAINT bls_username_unique UNIQUE (username_lc),
  CONSTRAINT bls_username_format CHECK (
    username ~ '^[a-zA-Z0-9_]{3,20}$'
  )
);
CREATE INDEX IF NOT EXISTS bls_users_name_idx ON bls_users (username_lc);

-- ---------- sessions ----------
CREATE TABLE IF NOT EXISTS bls_sessions (
  token_hash  TEXT PRIMARY KEY,               -- sha256 hex of the raw token
  user_id     UUID NOT NULL REFERENCES bls_users(id) ON DELETE CASCADE,
  expires_at  BIGINT NOT NULL                 -- epoch ms
);
CREATE INDEX IF NOT EXISTS bls_sessions_expiry_idx ON bls_sessions (expires_at);

-- ---------- cloud saves ----------
CREATE TABLE IF NOT EXISTS bls_saves (
  user_id   UUID NOT NULL REFERENCES bls_users(id) ON DELETE CASCADE,
  slot      INT  NOT NULL CHECK (slot BETWEEN 1 AND 3),
  data      JSONB NOT NULL,
  saved_at  BIGINT NOT NULL,
  PRIMARY KEY (user_id, slot)
);
