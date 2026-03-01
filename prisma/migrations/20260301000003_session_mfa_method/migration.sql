-- Phase 2 fix: track which MFA method was used in a session
-- Required to correctly reconstruct the AMR claim during token refresh.
-- Without this, WebAuthn-authenticated sessions incorrectly report 'otp' on refresh.

ALTER TABLE "usr_sessions"
  ADD COLUMN IF NOT EXISTS "mfaMethod" TEXT;

-- Back-fill: sessions with mfaVerifiedAt but no method default to 'totp'
-- (all existing sessions pre-date WebAuthn, so this is safe).
UPDATE "usr_sessions"
  SET "mfaMethod" = 'totp'
  WHERE "mfaVerifiedAt" IS NOT NULL AND "mfaMethod" IS NULL;
