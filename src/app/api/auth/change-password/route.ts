export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@platform/auth/session';
import { prisma } from '@platform/database/prisma';

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'Nytt lösenord måste vara minst 8 tecken.'),
  confirmPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Lösenorden matchar inte.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: 'Användaren hittades inte.' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Nuvarande lösenord är felaktigt.' }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return NextResponse.json({ ok: true });
}
