'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { clockIn, clockOut, getCurrentAttendanceShift, type AttendanceShift } from '@shared/lib/api/attendance.api';
import { ClockIcon } from '@shared/ui/icons';

export function AttendanceControls({ initialShift }: { initialShift: AttendanceShift | null }) {
  const [shift, setShift] = useState<AttendanceShift | null>(initialShift);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getCurrentAttendanceShift().then(setShift).catch(() => {});
  }, []);

  async function run(action: 'in' | 'out') {
    setLoading(true);
    setError('');
    try {
      const next = action === 'in' ? await clockIn() : await clockOut();
      setShift(action === 'in' ? next : null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
        <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Status</p>
        <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">
          {shift ? `Incheckad sedan ${new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockInAt))}` : 'Inte incheckad'}
        </p>
      </div>
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run('in')} disabled={!!shift} loading={loading}>
          <ClockIcon />
          Stämpla in
        </Button>
        <Button type="button" variant="secondary" onClick={() => run('out')} disabled={!shift} loading={loading}>
          Stämpla ut
        </Button>
      </div>
    </div>
  );
}
