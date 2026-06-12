import { getSessionUser, hasPermission } from '@modules/supporting/auth';
import { TasksClient } from './tasks-client';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await getSessionUser();
  const canWrite = user ? await hasPermission(user.roles, 'tasks.write').catch(() => false) : false;
  return <TasksClient canWrite={canWrite} />;
}
