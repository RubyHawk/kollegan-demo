// ─── WebAuthn credential repository ───────────────────────────────────────────
// Prisma 7 returns BYTEA columns as Uint8Array<ArrayBuffer>.
// @simplewebauthn/server v13 expects Uint8Array for credential bytes.

import { prisma } from '@platform/database/prisma';
import type { WebAuthnCredential, CreateWebAuthnCredentialInput } from '../domain/webauthn.entity';

type PrismaRow = {
  id: string;
  userId: string;
  credentialId: Uint8Array;
  publicKey: Uint8Array;
  counter: bigint;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

function toEntity(row: PrismaRow): WebAuthnCredential {
  return {
    id: row.id,
    userId: row.userId,
    credentialId: Buffer.from(row.credentialId),   // normalise Uint8Array<ArrayBufferLike> → Buffer<ArrayBuffer>
    publicKey: Buffer.from(row.publicKey),
    counter: row.counter,
    name: row.name,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}

export const webAuthnRepository = {
  async create(input: CreateWebAuthnCredentialInput): Promise<WebAuthnCredential> {
    const row = await prisma.webAuthnCredential.create({
      data: {
        userId: input.userId,
        credentialId: Buffer.from(input.credentialId),
        publicKey: Buffer.from(input.publicKey),
        counter: input.counter,
        name: input.name,
      },
    });
    return toEntity(row as PrismaRow);
  },

  async findByUserId(userId: string): Promise<WebAuthnCredential[]> {
    const rows = await prisma.webAuthnCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return (rows as PrismaRow[]).map(toEntity);
  },

  async findByCredentialId(credentialId: Uint8Array): Promise<WebAuthnCredential | null> {
    const row = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: Buffer.from(credentialId) },
    });
    return row ? toEntity(row as PrismaRow) : null;
  },

  async updateCounter(id: string, counter: bigint): Promise<void> {
    await prisma.webAuthnCredential.update({
      where: { id },
      data: { counter, lastUsedAt: new Date() },
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    await prisma.webAuthnCredential.deleteMany({
      where: { id, userId },
    });
  },

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.webAuthnCredential.deleteMany({
      where: { userId },
    });
  },
};
