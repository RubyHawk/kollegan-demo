import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEMO_USER = {
  email: 'staff@demo-hotel.com',
  password: 'demo1234',
  role: 'receptionist',
};

export async function POST() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

  const user = await prisma.staffUser.upsert({
    where: { email: DEMO_USER.email },
    update: { passwordHash, role: DEMO_USER.role },
    create: { email: DEMO_USER.email, passwordHash, role: DEMO_USER.role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    success: true,
    message: 'Demo staff user created (or updated).',
    user,
    credentials: {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    },
  });
}
