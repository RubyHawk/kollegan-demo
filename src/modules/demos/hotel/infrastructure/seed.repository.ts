import { prisma } from '@platform/database/prisma';
import type { DemoHotelStaff, SeededHotelStaffUser } from '../domain/seed.entity';

export async function seedHotelStaffUser(
  staff: DemoHotelStaff,
  passwordHash: string
): Promise<SeededHotelStaffUser> {
  const existing = await prisma.staffUser.findUnique({
    where: { email: staff.email },
    select: { id: true },
  });

  const user = await prisma.staffUser.upsert({
    where: { email: staff.email },
    update: { passwordHash, role: staff.role },
    create: { email: staff.email, passwordHash, role: staff.role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return { ...user, status: existing ? 'updated' : 'created' };
}
