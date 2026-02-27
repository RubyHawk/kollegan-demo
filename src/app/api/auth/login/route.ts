import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@core/database/prisma';
import { signRefreshToken } from '@core/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-post och lösenord krävs.' }, { status: 400 });
    }

    const user = await prisma.staffUser.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Fel e-post eller lösenord.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Fel e-post eller lösenord.' }, { status: 401 });
    }

    await prisma.staffUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Use refresh token TTL (7 days) for the session cookie
    const token = await signRefreshToken({ sub: user.id, role: user.role });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Serverfel. Försök igen.' }, { status: 500 });
  }
}
