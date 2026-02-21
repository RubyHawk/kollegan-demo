import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/roomStore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/n8n/crm
 *
 * Called by n8n at the end of a call to log collected CRM contact data.
 * Body: {
 *   name?: string;
 *   email?: string;
 *   phone?: string;
 *   company?: string;
 *   notes?: string;
 *   summary?: string;
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, phone, company, notes, summary } = body;

  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: 'At least one of name, email, or phone is required' },
      { status: 400 }
    );
  }

  const displayName = name ?? email ?? phone ?? 'Okänd gäst';
  const message = summary
    ? `Kundprofil: ${displayName} — ${summary}`
    : `Kundprofil insamlad för ${displayName}.`;

  const event = logActivity({
    type: 'crm_contact',
    message,
    metadata: { name, email, phone, company, notes, summary },
  });

  return NextResponse.json({ success: true, event });
}
