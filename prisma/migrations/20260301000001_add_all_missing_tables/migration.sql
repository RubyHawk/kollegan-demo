-- Migration: 20260301000001_add_all_missing_tables
--
-- Creates all tables that exist in schema.prisma but were absent from the initial
-- migration (which only covered demo_hotel_* tables).
--
-- Uses IF NOT EXISTS throughout — safe to apply against a DB that already has
-- some of these tables (e.g. created via `prisma db push`).
--
-- Execution order respects FK dependencies:
--   org_organizations → wf_* → evt_* → lead_* → usr_* → prt_* → aud_*

-- ─── Alter existing demo tables: add organizationId ──────────────────────────
-- These tables were created by the initial migration without organizationId.

ALTER TABLE "demo_hotel_customers"       ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "demo_hotel_bookings"        ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "demo_hotel_call_transcripts" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "demo_hotel_crm_records"     ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

CREATE INDEX IF NOT EXISTS "demo_hotel_customers_organizationId_idx"        ON "demo_hotel_customers"("organizationId");
CREATE INDEX IF NOT EXISTS "demo_hotel_bookings_organizationId_idx"         ON "demo_hotel_bookings"("organizationId");
CREATE INDEX IF NOT EXISTS "demo_hotel_call_transcripts_organizationId_idx" ON "demo_hotel_call_transcripts"("organizationId");
CREATE INDEX IF NOT EXISTS "demo_hotel_crm_records_organizationId_idx"      ON "demo_hotel_crm_records"("organizationId");

-- ─── Organization ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "org_organizations" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "slug"        TEXT         NOT NULL,
    "plan"        TEXT         NOT NULL DEFAULT 'demo',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgType"     TEXT         NOT NULL DEFAULT 'internal',
    "parentOrgId" TEXT,
    CONSTRAINT "org_organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_organizations_slug_key" ON "org_organizations"("slug");
CREATE        INDEX IF NOT EXISTS "org_organizations_slug_idx" ON "org_organizations"("slug");
CREATE        INDEX IF NOT EXISTS "org_organizations_orgType_idx" ON "org_organizations"("orgType");

-- Add FK from demo tables → org_organizations (idempotent via exception catch)
DO $$ BEGIN ALTER TABLE "demo_hotel_customers"        ADD CONSTRAINT "demo_hotel_customers_organizationId_fkey"        FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "demo_hotel_bookings"         ADD CONSTRAINT "demo_hotel_bookings_organizationId_fkey"         FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "demo_hotel_call_transcripts" ADD CONSTRAINT "demo_hotel_call_transcripts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "demo_hotel_crm_records"      ADD CONSTRAINT "demo_hotel_crm_records_organizationId_fkey"      FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Automation: Workflows ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "wf_workflows" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "name"           TEXT         NOT NULL,
    "description"    TEXT,
    "trigger"        JSONB        NOT NULL,
    "steps"          JSONB        NOT NULL,
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "version"        INTEGER      NOT NULL DEFAULT 1,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wf_workflows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wf_workflows_organizationId_isActive_idx"  ON "wf_workflows"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "wf_workflows_organizationId_createdAt_idx" ON "wf_workflows"("organizationId", "createdAt");

DO $$ BEGIN ALTER TABLE "wf_workflows" ADD CONSTRAINT "wf_workflows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Workflow Runs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "wf_workflow_runs" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "workflowId"     TEXT         NOT NULL,
    "status"         TEXT         NOT NULL DEFAULT 'pending',
    "trigger"        JSONB        NOT NULL,
    "context"        JSONB        NOT NULL DEFAULT '{}',
    "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),
    "error"          TEXT,
    CONSTRAINT "wf_workflow_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wf_workflow_runs_organizationId_status_idx"     ON "wf_workflow_runs"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "wf_workflow_runs_organizationId_workflowId_idx" ON "wf_workflow_runs"("organizationId", "workflowId");
CREATE INDEX IF NOT EXISTS "wf_workflow_runs_organizationId_startedAt_idx"  ON "wf_workflow_runs"("organizationId", "startedAt");

DO $$ BEGIN ALTER TABLE "wf_workflow_runs" ADD CONSTRAINT "wf_workflow_runs_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "wf_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Workflow Run Steps ───────────────────────────────────────────────────────
-- organizationId is denormalized from wf_workflow_runs for RLS filtering.
-- No FK constraint to org_organizations — integrity flows through runId.

CREATE TABLE IF NOT EXISTS "wf_workflow_run_steps" (
    "id"             TEXT         NOT NULL,
    "runId"          TEXT         NOT NULL,
    "organizationId" TEXT,
    "stepId"         TEXT         NOT NULL,
    "status"         TEXT         NOT NULL DEFAULT 'pending',
    "input"          JSONB,
    "output"         JSONB,
    "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),
    "error"          TEXT,
    "retryCount"     INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT "wf_workflow_run_steps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wf_workflow_run_steps_runId_idx"          ON "wf_workflow_run_steps"("runId");
CREATE INDEX IF NOT EXISTS "wf_workflow_run_steps_runId_stepId_idx"   ON "wf_workflow_run_steps"("runId", "stepId");
CREATE INDEX IF NOT EXISTS "wf_workflow_run_steps_organizationId_idx" ON "wf_workflow_run_steps"("organizationId");

DO $$ BEGIN ALTER TABLE "wf_workflow_run_steps" ADD CONSTRAINT "wf_workflow_run_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "wf_workflow_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also add organizationId column if table already existed without it
ALTER TABLE "wf_workflow_run_steps" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ─── Domain Event Log ─────────────────────────────────────────────────────────
-- Creates table with organizationId. If it already exists with the old field name
-- 'orgId' (from a prior db push), the DO block renames it.

CREATE TABLE IF NOT EXISTS "evt_domain_events" (
    "id"             TEXT         NOT NULL,
    "type"           TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "aggregateId"    TEXT         NOT NULL,
    "payload"        JSONB        NOT NULL,
    "occurredAt"     TIMESTAMP(3) NOT NULL,
    "processedAt"    TIMESTAMP(3),
    CONSTRAINT "evt_domain_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "evt_domain_events_organizationId_type_idx"      ON "evt_domain_events"("organizationId", "type");
CREATE INDEX IF NOT EXISTS "evt_domain_events_organizationId_occurredAt_idx" ON "evt_domain_events"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "evt_domain_events_aggregateId_idx"              ON "evt_domain_events"("aggregateId");

-- Rename orgId → organizationId if the table already existed with the old column name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'evt_domain_events' AND column_name = 'orgId'
    ) THEN
        ALTER TABLE "evt_domain_events" RENAME COLUMN "orgId" TO "organizationId";
        DROP INDEX IF EXISTS "evt_domain_events_orgId_type_idx";
        DROP INDEX IF EXISTS "evt_domain_events_orgId_occurredAt_idx";
        CREATE INDEX IF NOT EXISTS "evt_domain_events_organizationId_type_idx"       ON "evt_domain_events"("organizationId", "type");
        CREATE INDEX IF NOT EXISTS "evt_domain_events_organizationId_occurredAt_idx" ON "evt_domain_events"("organizationId", "occurredAt");
    END IF;
END $$;

-- ─── Leads ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "lead_leads" (
    "id"             TEXT              NOT NULL,
    "organizationId" TEXT              NOT NULL,
    "name"           TEXT              NOT NULL,
    "email"          TEXT,
    "phone"          TEXT,
    "company"        TEXT,
    "status"         TEXT              NOT NULL DEFAULT 'new',
    "source"         TEXT              NOT NULL DEFAULT 'manual',
    "score"          INTEGER,
    "assignedTo"     TEXT,
    "notes"          TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "createdAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt"    TIMESTAMP(3),
    "deletedAt"      TIMESTAMP(3),
    "customerId"     TEXT,
    CONSTRAINT "lead_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_status_idx"     ON "lead_leads"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_createdAt_idx"  ON "lead_leads"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_assignedTo_idx" ON "lead_leads"("organizationId", "assignedTo");
CREATE INDEX IF NOT EXISTS "lead_leads_deletedAt_idx"                 ON "lead_leads"("deletedAt");

DO $$ BEGIN ALTER TABLE "lead_leads" ADD CONSTRAINT "lead_leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Lead Activities ──────────────────────────────────────────────────────────
-- organizationId is denormalized from lead_leads for RLS filtering.

CREATE TABLE IF NOT EXISTS "lead_activities" (
    "id"             TEXT         NOT NULL,
    "leadId"         TEXT         NOT NULL,
    "organizationId" TEXT,
    "type"           TEXT         NOT NULL,
    "content"        TEXT         NOT NULL,
    "createdBy"      TEXT         NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP(3),
    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_activities_leadId_createdAt_idx"  ON "lead_activities"("leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_activities_leadId_type_idx"        ON "lead_activities"("leadId", "type");
CREATE INDEX IF NOT EXISTS "lead_activities_organizationId_idx"     ON "lead_activities"("organizationId");

DO $$ BEGIN ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also add organizationId column if table already existed without it
ALTER TABLE "lead_activities" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ─── Unified Users ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_users" (
    "id"              TEXT         NOT NULL,
    "email"           TEXT         NOT NULL,
    "passwordHash"    TEXT         NOT NULL,
    "firstName"       TEXT,
    "lastName"        TEXT,
    "avatarUrl"       TEXT,
    "userType"        TEXT         NOT NULL DEFAULT 'staff',
    "isActive"        BOOLEAN      NOT NULL DEFAULT true,
    "emailVerified"   BOOLEAN      NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt"     TIMESTAMP(3),
    "lastLoginIp"     TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"       TIMESTAMP(3),
    "organizationId"  TEXT,
    CONSTRAINT "usr_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_users_email_key"                  ON "usr_users"("email");
CREATE        INDEX IF NOT EXISTS "usr_users_email_idx"                  ON "usr_users"("email");
CREATE        INDEX IF NOT EXISTS "usr_users_organizationId_idx"         ON "usr_users"("organizationId");
CREATE        INDEX IF NOT EXISTS "usr_users_userType_organizationId_idx" ON "usr_users"("userType", "organizationId");
CREATE        INDEX IF NOT EXISTS "usr_users_deletedAt_idx"              ON "usr_users"("deletedAt");

DO $$ BEGIN ALTER TABLE "usr_users" ADD CONSTRAINT "usr_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Roles ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_roles" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "displayName" TEXT         NOT NULL,
    "description" TEXT,
    "isSystem"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usr_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_roles_name_key" ON "usr_roles"("name");

-- ─── Permissions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_permissions" (
    "id"        TEXT         NOT NULL,
    "resource"  TEXT         NOT NULL,
    "action"    TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usr_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_permissions_resource_action_key" ON "usr_permissions"("resource", "action");
CREATE        INDEX IF NOT EXISTS "usr_permissions_resource_idx"        ON "usr_permissions"("resource");

-- ─── Role Permissions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_role_permissions" (
    "roleId"       TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "usr_role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId")
);

DO $$ BEGIN ALTER TABLE "usr_role_permissions" ADD CONSTRAINT "usr_role_permissions_roleId_fkey"       FOREIGN KEY ("roleId")       REFERENCES "usr_roles"("id")       ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "usr_role_permissions" ADD CONSTRAINT "usr_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "usr_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── User Roles ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_user_roles" (
    "userId"         TEXT         NOT NULL,
    "roleId"         TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "grantedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy"      TEXT,
    CONSTRAINT "usr_user_roles_pkey" PRIMARY KEY ("userId", "roleId", "organizationId")
);

CREATE INDEX IF NOT EXISTS "usr_user_roles_userId_organizationId_idx" ON "usr_user_roles"("userId", "organizationId");
CREATE INDEX IF NOT EXISTS "usr_user_roles_roleId_idx"                ON "usr_user_roles"("roleId");

DO $$ BEGIN ALTER TABLE "usr_user_roles" ADD CONSTRAINT "usr_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "usr_user_roles" ADD CONSTRAINT "usr_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "usr_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Sessions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_sessions" (
    "id"              TEXT         NOT NULL,
    "userId"          TEXT         NOT NULL,
    "refreshTokenJti" TEXT         NOT NULL,
    "userAgent"       TEXT,
    "ipAddress"       TEXT,
    "issuedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"       TIMESTAMP(3) NOT NULL,
    "revokedAt"       TIMESTAMP(3),
    CONSTRAINT "usr_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_sessions_refreshTokenJti_key" ON "usr_sessions"("refreshTokenJti");
CREATE        INDEX IF NOT EXISTS "usr_sessions_userId_idx"          ON "usr_sessions"("userId");
CREATE        INDEX IF NOT EXISTS "usr_sessions_refreshTokenJti_idx" ON "usr_sessions"("refreshTokenJti");
CREATE        INDEX IF NOT EXISTS "usr_sessions_expiresAt_idx"       ON "usr_sessions"("expiresAt");

DO $$ BEGIN ALTER TABLE "usr_sessions" ADD CONSTRAINT "usr_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Email Verifications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_email_verifications" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "token"     TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usr_email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_email_verifications_token_key"    ON "usr_email_verifications"("token");
CREATE        INDEX IF NOT EXISTS "usr_email_verifications_userId_idx"   ON "usr_email_verifications"("userId");
CREATE        INDEX IF NOT EXISTS "usr_email_verifications_token_idx"    ON "usr_email_verifications"("token");

DO $$ BEGIN ALTER TABLE "usr_email_verifications" ADD CONSTRAINT "usr_email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Password Resets ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usr_password_resets" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "token"     TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usr_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usr_password_resets_token_key"  ON "usr_password_resets"("token");
CREATE        INDEX IF NOT EXISTS "usr_password_resets_userId_idx" ON "usr_password_resets"("userId");
CREATE        INDEX IF NOT EXISTS "usr_password_resets_token_idx"  ON "usr_password_resets"("token");

DO $$ BEGIN ALTER TABLE "usr_password_resets" ADD CONSTRAINT "usr_password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Customer Portal ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "prt_portals" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT         NOT NULL,
    "slug"           TEXT         NOT NULL,
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "customDomain"   TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provisionedBy"  TEXT,
    "provisionedAt"  TIMESTAMP(3),
    CONSTRAINT "prt_portals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prt_portals_organizationId_key" ON "prt_portals"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "prt_portals_slug_key"           ON "prt_portals"("slug");
CREATE        INDEX IF NOT EXISTS "prt_portals_slug_idx"           ON "prt_portals"("slug");

DO $$ BEGIN ALTER TABLE "prt_portals" ADD CONSTRAINT "prt_portals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Portal Members ───────────────────────────────────────────────────────────
-- organizationId is denormalized from prt_portals for RLS filtering.

CREATE TABLE IF NOT EXISTS "prt_portal_members" (
    "id"             TEXT         NOT NULL,
    "portalId"       TEXT         NOT NULL,
    "userId"         TEXT         NOT NULL,
    "organizationId" TEXT,
    "inviteEmail"    TEXT,
    "status"         TEXT         NOT NULL DEFAULT 'invited',
    "invitedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt"       TIMESTAMP(3),
    CONSTRAINT "prt_portal_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prt_portal_members_portalId_idx"       ON "prt_portal_members"("portalId");
CREATE INDEX IF NOT EXISTS "prt_portal_members_userId_idx"         ON "prt_portal_members"("userId");
CREATE INDEX IF NOT EXISTS "prt_portal_members_organizationId_idx" ON "prt_portal_members"("organizationId");

DO $$ BEGIN ALTER TABLE "prt_portal_members" ADD CONSTRAINT "prt_portal_members_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "prt_portals"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also add organizationId column if table already existed without it
ALTER TABLE "prt_portal_members" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ─── Audit Log ────────────────────────────────────────────────────────────────
-- Append-only. NEVER add UPDATE or DELETE permissions on this table.

CREATE TABLE IF NOT EXISTS "aud_audit_logs" (
    "id"             TEXT         NOT NULL,
    "organizationId" TEXT,
    "actorId"        TEXT,
    "actorType"      TEXT         NOT NULL DEFAULT 'user',
    "action"         TEXT         NOT NULL,
    "resourceType"   TEXT         NOT NULL,
    "resourceId"     TEXT         NOT NULL,
    "before"         JSONB,
    "after"          JSONB,
    "metadata"       JSONB,
    "occurredAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aud_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aud_audit_logs_organizationId_occurredAt_idx" ON "aud_audit_logs"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "aud_audit_logs_actorId_occurredAt_idx"        ON "aud_audit_logs"("actorId", "occurredAt");
CREATE INDEX IF NOT EXISTS "aud_audit_logs_resourceType_resourceId_idx"   ON "aud_audit_logs"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "aud_audit_logs_action_occurredAt_idx"         ON "aud_audit_logs"("action", "occurredAt");

-- actorId FK to usr_users — SET NULL on delete so audit rows survive GDPR purge
DO $$ BEGIN ALTER TABLE "aud_audit_logs" ADD CONSTRAINT "aud_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "usr_users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
