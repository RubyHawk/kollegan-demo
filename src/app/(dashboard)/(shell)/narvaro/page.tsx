import { getSessionUser } from '@modules/supporting/auth';
import { getCurrentAttendanceShift } from '@modules/generic/workforce';
import { AttendancePageClient } from './attendance-page-client';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const user = await getSessionUser();
  const initialShift = user?.orgId ? await getCurrentAttendanceShift(user.orgId, user.id).catch(() => null) : null;
  return <AttendancePageClient initialShift={initialShift} />;
}
