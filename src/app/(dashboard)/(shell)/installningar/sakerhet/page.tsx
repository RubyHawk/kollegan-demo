import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import SakerhetClient from './sakerhet-client';

export default async function SakerhetPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return <SakerhetClient />;
}
