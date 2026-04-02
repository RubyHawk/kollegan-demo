import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@platform/auth/session';
import { prisma } from '@platform/database/prisma';
import { z } from 'zod/v4';

const schema = z.object({
  firstName: z.string().max(50).optional(),
  lastName:  z.string().max(50).optional(),
  // base64 data URL or null to remove
  avatarUrl: z.string().max(600_000).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ detail: 'Invalid JSON' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ detail: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.firstName !== undefined) data.firstName = parsed.data.firstName || null;
  if (parsed.data.lastName !== undefined)  data.lastName  = parsed.data.lastName  || null;
  if (parsed.data.avatarUrl !== undefined) data.avatarUrl = parsed.data.avatarUrl;

  await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({ ok: true });
}
