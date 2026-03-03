import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';
import AppShell from '@shared/ui/app-shell';
import type { ReactNode } from 'react';

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    const user = await prisma.usr_users.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { email: true, firstName: true, lastName: true, userType: true },
    });
    if (!user) return null;
    const role = (payload.roles?.[0] ?? payload.role ?? user.userType ?? 'staff') as string;
    return { email: user.email, firstName: user.firstName, lastName: user.lastName, role };
  } catch {
    return null;
  }
}

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
