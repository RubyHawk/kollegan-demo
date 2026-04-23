export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '../../application/server-session.service';
import {
  changeAccountPassword,
  getAccountProfile,
  updateAccountProfile,
} from '../../application/account.service';

const ProfileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  avatarUrl: z.string().max(600_000).nullable().optional(),
  themeMode: z.enum(['light', 'dark', 'auto']).optional(),
  themeAccent: z.string().max(50).optional(),
  themeFontFamily: z.string().max(50).optional(),
  themeFontSize: z.enum(['small', 'medium', 'large']).optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Nytt lösenord måste vara minst 8 tecken.'),
  confirmPassword: z.string().min(1),
});

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

export async function handleGetProfile() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const profile = await getAccountProfile(user.id);
  if (!profile) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: profile });
}

export async function handleUpdateProfile(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ detail: 'Invalid JSON' }, { status: 400 });

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  await updateAccountProfile(user.id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function handleChangePassword(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    await changeAccountPassword(session.id, parsed.data);
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string }).code
      : undefined;

    if (code === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Användaren hittades inte.' }, { status: 404 });
    }
    if (code === 'PASSWORD_MISMATCH') {
      return NextResponse.json({ error: 'Lösenorden matchar inte.' }, { status: 400 });
    }
    if (code === 'INVALID_CURRENT_PASSWORD') {
      return NextResponse.json({ error: 'Nuvarande lösenord är felaktigt.' }, { status: 400 });
    }

    throw error;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', '', clearCookieOptions);
  res.cookies.set('portal_token', '', clearCookieOptions);
  res.cookies.set('at', '', clearCookieOptions);
  return res;
}
