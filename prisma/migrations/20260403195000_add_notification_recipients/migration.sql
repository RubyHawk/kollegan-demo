-- Add org-level notification routing recipients as a serialized JSON string.
ALTER TABLE "org_organizations"
ADD COLUMN IF NOT EXISTS "notificationRecipients" TEXT NOT NULL DEFAULT '[]';
