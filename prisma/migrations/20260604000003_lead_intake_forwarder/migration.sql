-- Lead intake forwarders and company-scoped CRM linking.
-- Additive only: no existing tables, columns, or business data are removed.

ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "normalizedEmail" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "normalizedPhone" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "sourceLabel" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "requestedService" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "referralSource" TEXT;
ALTER TABLE "lead_leads" ADD COLUMN IF NOT EXISTS "customFields" JSONB;

ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "crm_customers" ADD COLUMN IF NOT EXISTS "normalizedPhone" TEXT;

CREATE TABLE IF NOT EXISTS "lead_intake_forwarders" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'resend',
  "intakeAddress" TEXT NOT NULL,
  "normalizedIntakeAddress" TEXT NOT NULL,
  "senderEmail" TEXT,
  "senderName" TEXT,
  "fieldConfig" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "lead_intake_forwarders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lead_intake_forwarder_recipients" (
  "id" TEXT NOT NULL,
  "forwarderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_intake_forwarder_recipients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lead_intake_messages" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "companyId" TEXT,
  "forwarderId" TEXT,
  "leadId" TEXT,
  "customerId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'resend',
  "providerEventId" TEXT,
  "providerEmailId" TEXT,
  "messageId" TEXT,
  "fromAddress" TEXT,
  "toAddresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "subject" TEXT,
  "contentHash" TEXT,
  "parsedFields" JSONB,
  "status" TEXT NOT NULL DEFAULT 'received',
  "forwardStatus" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_intake_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_intake_forwarders_provider_normalizedIntakeAddress_key" ON "lead_intake_forwarders"("provider", "normalizedIntakeAddress");
CREATE INDEX IF NOT EXISTS "lead_intake_forwarders_organizationId_companyId_isActive_idx" ON "lead_intake_forwarders"("organizationId", "companyId", "isActive");
CREATE INDEX IF NOT EXISTS "lead_intake_forwarders_organizationId_createdAt_idx" ON "lead_intake_forwarders"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_intake_forwarders_deletedAt_idx" ON "lead_intake_forwarders"("deletedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "lead_intake_forwarder_recipients_forwarderId_userId_key" ON "lead_intake_forwarder_recipients"("forwarderId", "userId");
CREATE INDEX IF NOT EXISTS "lead_intake_forwarder_recipients_userId_idx" ON "lead_intake_forwarder_recipients"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "lead_intake_messages_provider_providerEventId_key" ON "lead_intake_messages"("provider", "providerEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_intake_messages_provider_providerEmailId_key" ON "lead_intake_messages"("provider", "providerEmailId");
CREATE INDEX IF NOT EXISTS "lead_intake_messages_organizationId_companyId_createdAt_idx" ON "lead_intake_messages"("organizationId", "companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_intake_messages_forwarderId_createdAt_idx" ON "lead_intake_messages"("forwarderId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_intake_messages_leadId_idx" ON "lead_intake_messages"("leadId");

CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_companyId_createdAt_idx" ON "lead_leads"("organizationId", "companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_normalizedEmail_idx" ON "lead_leads"("organizationId", "normalizedEmail");
CREATE INDEX IF NOT EXISTS "lead_leads_organizationId_normalizedPhone_idx" ON "lead_leads"("organizationId", "normalizedPhone");

CREATE INDEX IF NOT EXISTS "crm_customers_organizationId_companyId_email_idx" ON "crm_customers"("organizationId", "companyId", "email");
CREATE INDEX IF NOT EXISTS "crm_customers_organizationId_normalizedPhone_idx" ON "crm_customers"("organizationId", "normalizedPhone");

DO $$ BEGIN
  ALTER TABLE "lead_leads" ADD CONSTRAINT "lead_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "off_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "off_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_forwarders" ADD CONSTRAINT "lead_intake_forwarders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_forwarders" ADD CONSTRAINT "lead_intake_forwarders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "off_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_forwarder_recipients" ADD CONSTRAINT "lead_intake_forwarder_recipients_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "lead_intake_forwarders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_forwarder_recipients" ADD CONSTRAINT "lead_intake_forwarder_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usr_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_messages" ADD CONSTRAINT "lead_intake_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "org_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_messages" ADD CONSTRAINT "lead_intake_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "off_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_messages" ADD CONSTRAINT "lead_intake_messages_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "lead_intake_forwarders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_messages" ADD CONSTRAINT "lead_intake_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lead_intake_messages" ADD CONSTRAINT "lead_intake_messages_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
