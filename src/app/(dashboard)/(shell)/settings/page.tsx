import { getSessionUser } from '@platform/auth/session';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-ui';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <SettingsClient
      user={{
        email:     user.email,
        firstName: user.firstName ?? null,
        lastName:  user.lastName ?? null,
        role:      user.role,
      }}
    />
  );
}
