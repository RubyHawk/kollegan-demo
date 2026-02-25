import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@core/database/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SALT_ROUNDS = 12;

/**
 * GET /api/staff
 * Returns all staff users including their bcrypt hash (demo only).
 */
export async function GET() {
  try {
    const users = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, role: true, passwordHash: true, createdAt: true },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Kunde inte hämta anställda.' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Creates a new staff user with a bcrypt-hashed password.
 * Body: { email, password, role }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Ogiltig JSON.' }, { status: 400 });
  }

  const { email, password, role } = body as Record<string, string>;

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'email, password och role krävs.' }, { status: 400 });
  }
  if (!['receptionist', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Ogiltig roll.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Lösenordet måste vara minst 6 tecken.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'En användare med den e-postadressen finns redan.' }, { status: 409 });
    }

    const user = await prisma.staffUser.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, passwordHash: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Databasfel. Kontrollera att migrationer är körda.' }, { status: 500 });
  }
}

/**
 * DELETE /api/staff?id=<userId>
 * Deletes a staff user by ID.
 */
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id krävs.' }, { status: 400 });
  }
  try {
    await prisma.staffUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kunde inte radera användaren.' }, { status: 500 });
  }
}
