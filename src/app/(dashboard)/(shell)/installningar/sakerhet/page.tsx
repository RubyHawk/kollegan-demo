import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import SakerhetClient from './sakerhet-client';

export default async function SakerhetPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return (
    <SakerhetClient
      user={{
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      }}
    />
  );
}
