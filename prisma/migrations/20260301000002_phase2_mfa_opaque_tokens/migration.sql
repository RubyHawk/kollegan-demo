-- Migration: 20260301000002_phase2_mfa_opaque_tokens
--
-- Phase 2 MFA + opaque refresh tokens.
--
-- Changes:
--   usr_users    → add MFA columns (mfaEnabled, totpSecret, backupCodes, mfaGraceExpiresAt)
--                  and webAuthnCredentials back-relation (no column — FK lives on credential side)
--   usr_sessions → rename refreshTokenJti → refreshTokenHash (opaque token, SHA-256 hash)
--                  add mfaVerifiedAt
--   usr_webauthn_credentials → new table
--
-- Uses IF NOT EXISTS / IF EXISTS so re-applying is safe.
-- The refreshTokenJti → refreshTokenHash rename is done with ADD + DROP to avoid
-- index conflicts; existing sessions are invalidated (all users will be signed out
-- on the first deploy after this migration — expected behaviour for a security upgrade).

-- ─── usr_users: MFA columns ───────────────────────────────────────────────────

ALTER TABLE "usr_users"
  ADD COLUMN IF NOT EXISTS "mfaEnabled"        BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "totpSecret"        TEXT,
  ADD COLUMN IF NOT EXISTS "backupCodes"       TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "mfaGraceExpiresAt" TIMESTAMP(3);

-- Set grace period for all existing users: 7 days from migration time.
-- New users created after this migration will have mfaGraceExpiresAt = NULL
-- (enforced immediately — they must set up MFA during onboarding).
UPDATE "usr_users"
  SET "mfaGraceExpiresAt" = NOW() + INTERVAL '7 days'
  WHERE "mfaGraceExpiresAt" IS NULL;

-- ─── usr_sessions: opaque token + MFA tracking ────────────────────────────────

-- Add the new columns first
ALTER TABLE "usr_sessions"
  ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaVerifiedAt"    TIMESTAMP(3);

-- Invalidate all existing sessions: copy jti as a placeholder hash so the NOT NULL
-- constraint below is satisfied. These sessions will be rejected by the new auth
-- logic (which looks up by SHA-256 hash, not JTI), so all users are signed out.
UPDATE "usr_sessions"
  SET "refreshTokenHash" = 'invalidated:' || "refreshTokenJti"
  WHERE "refreshTokenHash" IS NULL;

-- Now enforce NOT NULL and UNIQUE on the new column
ALTER TABLE "usr_sessions"
  ALTER COLUMN "refreshTokenHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "usr_sessions_refreshTokenHash_key"
  ON "usr_sessions"("refreshTokenHash");

CREATE INDEX IF NOT EXISTS "usr_sessions_refreshTokenHash_idx"
  ON "usr_sessions"("refreshTokenHash");

-- Drop the old JTI column and its index
DROP INDEX IF EXISTS "usr_sessions_refreshTokenJti_key";
DROP INDEX IF EXISTS "usr_sessions_refreshTokenJti_idx";

ALTER TABLE "usr_sessions"
  DROP COLUMN IF EXISTS "refreshTokenJti";

ALTER TABLE "usr_sessions"
  ADD COLUMN IF NOT EXISTS "mfaVerifiedAt" TIMESTAMP(3);

-- ─── usr_webauthn_credentials: new table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_webauthn_credentials" (
    "id"           TEXT         NOT NULL,
    "userId"       TEXT         NOT NULL,
    "credentialId" BYTEA        NOT NULL,
    "publicKey"    BYTEA        NOT NULL,
    "counter"      BIGINT       NOT NULL DEFAULT 0,
    "name"         TEXT         NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt"   TIMESTAMP(3),

    CONSTRAINT "usr_webauthn_credentials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "usr_webauthn_credentials_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "usr_users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_webauthn_credentials_credentialId_key"
    ON "usr_webauthn_credentials"("credentialId");

CREATE INDEX IF NOT EXISTS "usr_webauthn_credentials_userId_idx"
    ON "usr_webauthn_credentials"("userId");
