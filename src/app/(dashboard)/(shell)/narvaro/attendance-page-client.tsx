'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { listTodayAttendance, type AttendanceShift, type AttendanceShiftWithUser } from '@shared/lib/api/attendance.api';
import { AttendanceControls } from './attendance-controls';

function displayName(shift: AttendanceShiftWithUser) {
  return [shift.user.firstName, shift.user.lastName].filter(Boolean).join(' ') || shift.user.email;
}

export function AttendancePageClient({ initialShift }: { initialShift: AttendanceShift | null }) {
  const [shifts, setShifts] = useState<AttendanceShiftWithUser[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setShifts(await listTodayAttendance());
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Närvaro"
        description="Stämpla in och ut, och följ dagens närvaro i restaurangen."
      />
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Panel className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Min tid</h2>
          <AttendanceControls initialShift={initialShift} />
        </Panel>
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Dagens pass</h2>
            <button type="button" onClick={() => void load()} className="text-sm font-medium text-[var(--ui-accent)]">Uppdatera</button>
          </div>
          {error ? <p className="text-sm text-[var(--ui-danger-text)]">{error}</p> : null}
          <div className="divide-y divide-[var(--ui-border)]">
            {shifts.length === 0 ? (
              <p className="py-4 text-sm text-[var(--ui-text-muted)]">Inga pass registrerade idag.</p>
            ) : shifts.map((shift) => (
              <div key={shift.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ui-text)]">{displayName(shift)}</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">{shift.user.email}</p>
                </div>
                <p className="text-sm tabular-nums text-[var(--ui-text-secondary)]">
                  {new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockInAt))}
                  {shift.clockOutAt ? ` - ${new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockOutAt))}` : ''}
                </p>
                <StatusBadge tone={shift.status === 'active' ? 'success' : 'neutral'}>{shift.status === 'active' ? 'Aktiv' : 'Klar'}</StatusBadge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
