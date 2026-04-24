export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// Registration is disabled. Accounts are created by administrators via /settings/users.
export function POST() {
  return NextResponse.json({ error: 'Registration is disabled.' }, { status: 403 });
}
