/**
 * POST /api/auth/register
 * For testing only — creates a staff account with no org (super-admin level).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { userRepository } from '@modules/supporting/auth';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email is required and password must be at least 8 characters.' }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const mfaGraceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day grace period
  const user = await userRepository.create({ email, passwordHash, userType: 'staff', organizationId: null, mfaGraceExpiresAt });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
