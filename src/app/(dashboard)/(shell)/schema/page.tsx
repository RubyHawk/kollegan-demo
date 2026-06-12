import { getSessionUser, hasPermission } from '@modules/supporting/auth';
import { ScheduleClient } from './schedule-client';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const user = await getSessionUser();
  const canEdit = user ? await hasPermission(user.roles, 'schedule.write').catch(() => false) : false;
  return <ScheduleClient canEdit={canEdit} currentUserId={user?.id ?? ''} />;
}
