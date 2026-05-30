-- Migration: 20260531000001_extend_mfa_grace_deadline
--
-- MFA enrollment is still being developed. Extend the grace window for existing
-- users without enrolled MFA so staff and customer admins are not blocked while
-- rollout work continues. Forward-only and non-destructive: no rows are removed.

UPDATE "usr_users"
SET "mfaGraceExpiresAt" = NOW() + INTERVAL '2 years'
WHERE "mfaEnabled" = FALSE
  AND "deletedAt" IS NULL
  AND (
    "mfaGraceExpiresAt" IS NULL
    OR "mfaGraceExpiresAt" < NOW() + INTERVAL '2 years'
  );
