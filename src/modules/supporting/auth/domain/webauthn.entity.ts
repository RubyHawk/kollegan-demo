// ─── WebAuthn credential entity ───────────────────────────────────────────────
// Pure domain type — no Prisma, no HTTP.
// Uses Uint8Array (not Buffer) to match Prisma 7 and @simplewebauthn/server v13.

export interface WebAuthnCredential {
  id: string;
  userId: string;
  credentialId: Uint8Array;   // raw bytes from WebAuthn assertion
  publicKey: Uint8Array;      // COSE-encoded public key
  counter: bigint;            // signature counter — monotonically increasing; detect cloning
  name: string;               // user-assigned label: "MacBook Touch ID", "YubiKey 5"
  aaguid: string | null;
  credentialDeviceType: string | null;
  credentialBackedUp: boolean | null;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface CreateWebAuthnCredentialInput {
  userId: string;
  credentialId: Uint8Array;
  publicKey: Uint8Array;
  counter: bigint;
  name: string;
  aaguid?: string | null;
  credentialDeviceType?: string | null;
  credentialBackedUp?: boolean | null;
  transports?: string[];
}
