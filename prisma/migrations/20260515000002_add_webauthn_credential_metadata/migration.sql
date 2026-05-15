ALTER TABLE "usr_webauthn_credentials"
ADD COLUMN "aaguid" TEXT,
ADD COLUMN "credentialDeviceType" TEXT,
ADD COLUMN "credentialBackedUp" BOOLEAN,
ADD COLUMN "transports" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
