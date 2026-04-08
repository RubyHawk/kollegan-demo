import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@platform/auth/session';
import { prisma } from '@platform/database/prisma';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().max(50).optional(),
  lastName:  z.string().max(50).optional(),
  // base64 data URL or null to remove
  avatarUrl: z.string().max(600_000).nullable().optional(),
  themeMode: z.enum(['light', 'dark', 'auto']).optional(),
  themeAccent: z.string().max(50).optional(),
  themeFontFamily: z.string().max(50).optional(),
  themeFontSize: z.enum(['small', 'medium', 'large']).optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      themeMode: true,
      themeAccent: true,
      themeFontFamily: true,
      themeFontSize: true,
    },
  });

  if (!profile) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: profile });
}

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
  if (parsed.data.themeMode !== undefined) data.themeMode = parsed.data.themeMode || null;
  if (parsed.data.themeAccent !== undefined) data.themeAccent = parsed.data.themeAccent || null;
  if (parsed.data.themeFontFamily !== undefined) data.themeFontFamily = parsed.data.themeFontFamily || null;
  if (parsed.data.themeFontSize !== undefined) data.themeFontSize = parsed.data.themeFontSize || null;

  await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({ ok: true });
}
