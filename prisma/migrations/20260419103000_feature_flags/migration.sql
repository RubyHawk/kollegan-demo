-- Feature flags / progressive delivery foundation.
-- Additive only: creates new enums, tables, indexes, and foreign keys.

DO $$ BEGIN
  CREATE TYPE "FeatureFlagType" AS ENUM ('release', 'kill_switch', 'experiment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeatureFlagRolloutMode" AS ENUM ('off', 'on', 'percentage', 'users');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "ff_feature_flags" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "type" "FeatureFlagType" NOT NULL DEFAULT 'release',
  "owner" TEXT NOT NULL,
  "environment" TEXT NOT NULL DEFAULT 'production',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "rolloutMode" "FeatureFlagRolloutMode" NOT NULL DEFAULT 'off',
  "rolloutScope" JSONB NOT NULL DEFAULT '{}',
  "expiresAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ff_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ff_feature_flag_audit_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "featureFlagId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ff_feature_flag_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ff_feature_flags_organizationId_environment_key_key"
  ON "ff_feature_flags"("organizationId", "environment", "key");
CREATE INDEX "ff_feature_flags_organizationId_environment_idx"
  ON "ff_feature_flags"("organizationId", "environment");
CREATE INDEX "ff_feature_flags_organizationId_enabled_idx"
  ON "ff_feature_flags"("organizationId", "enabled");
CREATE INDEX "ff_feature_flags_organizationId_expiresAt_idx"
  ON "ff_feature_flags"("organizationId", "expiresAt");
CREATE INDEX "ff_feature_flags_deletedAt_idx"
  ON "ff_feature_flags"("deletedAt");

CREATE INDEX "ff_feature_flag_audit_events_organizationId_featureFlagId_createdAt_idx"
  ON "ff_feature_flag_audit_events"("organizationId", "featureFlagId", "createdAt");
CREATE INDEX "ff_feature_flag_audit_events_organizationId_action_createdAt_idx"
  ON "ff_feature_flag_audit_events"("organizationId", "action", "createdAt");

ALTER TABLE "ff_feature_flags"
  ADD CONSTRAINT "ff_feature_flags_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ff_feature_flag_audit_events"
  ADD CONSTRAINT "ff_feature_flag_audit_events_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ff_feature_flag_audit_events"
  ADD CONSTRAINT "ff_feature_flag_audit_events_featureFlagId_fkey"
  FOREIGN KEY ("featureFlagId") REFERENCES "ff_feature_flags"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
