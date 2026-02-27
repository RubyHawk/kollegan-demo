import { cookies } from 'next/headers';
import { verifyToken } from '@core/auth/jwt';
import DemoGrid from '@modules/generic/dashboard/components/demo-grid';

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return { role: payload.role as string };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const user = await getUser();

  return <DemoGrid userRole={user?.role ?? null} />;
}
