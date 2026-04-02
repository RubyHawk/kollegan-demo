/**
 * WebAuthn service — passkey / security key registration and authentication.
 *
 * Uses @simplewebauthn/server v13 for ceremony handling.
 * Challenges are stored in Redis with a 5-minute TTL.
 *
 * RP configuration:
 *   rpId:   kollegan.dev
 *   rpName: Kollegan
 *   origin: https://kollegan.dev
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { logger } from '@platform/logging/logger';
import { webAuthnRepository } from '../infrastructure/webauthn.repository';
import { BRAND_DEFAULT_PUBLIC_ORIGIN, BRAND_NAME } from '@shared/branding';

const TAG = 'WebAuthnService';

const ORIGIN = process.env.WEBAUTHN_ORIGIN
  || process.env.APP_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : BRAND_DEFAULT_PUBLIC_ORIGIN);
const RP_ID = process.env.WEBAUTHN_RP_ID || new URL(ORIGIN).hostname;
const RP_NAME = process.env.WEBAUTHN_RP_NAME || BRAND_NAME;

const CHALLENGE_TTL_SEC = 300;

// ─── Challenge storage helpers ─────────────────────────────────────────────────

async function storeChallenge(key: string, challenge: string): Promise<void> {
  const { redis } = await import('@platform/cache/redis');
  await redis.setex(key, CHALLENGE_TTL_SEC, challenge);
}

async function consumeChallenge(key: string): Promise<string | null> {
  const { redis } = await import('@platform/cache/redis');
  const challenge = await redis.get(key);
  if (challenge) await redis.del(key);
  return challenge;
}

function registerChallengeKey(userId: string): string {
  return `webauthn:register:${userId}`;
}

function authChallengeKey(userId: string): string {
  return `webauthn:auth:${userId}`;
}

// @simplewebauthn/server v13 expects credential IDs as base64url strings in excludeCredentials
function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

// ─── Registration ceremony ─────────────────────────────────────────────────────

export async function beginRegistration(userId: string, userEmail: string): Promise<object> {
  const existingCredentials = await webAuthnRepository.findByUserId(userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(userId),
    userName: userEmail,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({
      id: toBase64Url(c.credentialId),
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await storeChallenge(registerChallengeKey(userId), options.challenge);

  logger.info(TAG, 'Registration options generated', { userId });

  return options;
}

export async function completeRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  credentialName: string,
): Promise<{ credentialId: string }> {
  const expectedChallenge = await consumeChallenge(registerChallengeKey(userId));
  if (!expectedChallenge) {
    throw Object.assign(new Error('Challenge expired or not found'), { code: 'CHALLENGE_EXPIRED' });
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw Object.assign(new Error('Registration verification failed'), { code: 'WEBAUTHN_FAILED' });
  }

  const { credential } = verification.registrationInfo;

  const stored = await webAuthnRepository.create({
    userId,
    credentialId: Buffer.from(credential.id, 'base64url'),   // id is Base64URLString in v13
    publicKey: Buffer.from(credential.publicKey),
    counter: BigInt(credential.counter),
    name: credentialName.trim().slice(0, 64) || 'Passkey',
  });

  logger.info(TAG, 'Passkey registered', { userId, credentialId: stored.id });

  return { credentialId: stored.id };
}

// ─── Authentication ceremony ───────────────────────────────────────────────────

export async function beginAuthentication(userId: string): Promise<object> {
  const credentials = await webAuthnRepository.findByUserId(userId);

  if (credentials.length === 0) {
    throw Object.assign(new Error('No passkeys registered for this user'), { code: 'NO_CREDENTIALS' });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map((c) => ({
      id: toBase64Url(c.credentialId),
    })),
    userVerification: 'preferred',
  });

  await storeChallenge(authChallengeKey(userId), options.challenge);

  logger.info(TAG, 'Authentication options generated', { userId });

  return options;
}

export async function completeAuthentication(
  userId: string,
  response: AuthenticationResponseJSON,
): Promise<void> {
  const expectedChallenge = await consumeChallenge(authChallengeKey(userId));
  if (!expectedChallenge) {
    throw Object.assign(new Error('Challenge expired or not found'), { code: 'CHALLENGE_EXPIRED' });
  }

  // Decode the credential ID from the response (base64url string) to find it in DB
  const credentialIdBytes = Buffer.from(response.id, 'base64url');
  const credential = await webAuthnRepository.findByCredentialId(credentialIdBytes);

  if (!credential || credential.userId !== userId) {
    throw Object.assign(new Error('Credential not found'), { code: 'CREDENTIAL_NOT_FOUND' });
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: false,
    credential: {
      id: toBase64Url(credential.credentialId),   // WebAuthnCredential.id is Base64URLString
      publicKey: Buffer.from(credential.publicKey),
      counter: Number(credential.counter),
    },
  });

  if (!verification.verified) {
    throw Object.assign(new Error('Authentication verification failed'), { code: 'WEBAUTHN_FAILED' });
  }

  await webAuthnRepository.updateCounter(
    credential.id,
    BigInt(verification.authenticationInfo.newCounter),
  );

  logger.info(TAG, 'Passkey authentication verified', { userId, credentialId: credential.id });
}

// ─── Credential management ────────────────────────────────────────────────────

export async function listCredentials(userId: string): Promise<Array<{
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}>> {
  const creds = await webAuthnRepository.findByUserId(userId);
  return creds.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt,
    lastUsedAt: c.lastUsedAt,
  }));
}

export async function deleteCredential(credentialId: string, userId: string): Promise<void> {
  await webAuthnRepository.delete(credentialId, userId);
  logger.info(TAG, 'Passkey deleted', { userId, credentialId });
}
