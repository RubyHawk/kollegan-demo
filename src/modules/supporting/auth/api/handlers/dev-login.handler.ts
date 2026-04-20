import { NextRequest, NextResponse } from 'next/server';
import { createDevelopmentAccessToken } from '../../application/dev-login.service';

const ACCESS_TTL_SEC = 60 * 60 * 24;

export async function handleDevLogin(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const token = await createDevelopmentAccessToken();
  const redirect = req.nextUrl.searchParams.get('redirect') ?? '/';
  const res = NextResponse.redirect(new URL(redirect, req.url));

  res.cookies.set('at', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: ACCESS_TTL_SEC,
    path: '/',
  });

  return res;
}
