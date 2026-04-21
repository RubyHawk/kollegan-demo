import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import ProfilClient from './profil-client';

export default async function ProfilPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return (
    <ProfilClient
      user={{
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
      }}
    />
  );
}
