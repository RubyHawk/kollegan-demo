import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import MfaSupportClient from './mfa-support-client';

export default async function MfaSupportPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  const roles = user.roles ?? [user.role];
  const canAccess = roles.includes('super_admin') || roles.includes('admin') || roles.includes('helpdesk');
  if (!canAccess) {
    redirect('/installningar/sakerhet');
  }

  return (
    <MfaSupportClient
      user={{
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roles,
        mfaAuthenticated: user.mfaAuthenticated,
      }}
    />
  );
}
