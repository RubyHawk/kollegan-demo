import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import { CustomFieldsContainer } from './_containers/custom-fields-container';

export default async function CustomFieldsSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return <CustomFieldsContainer />;
}
