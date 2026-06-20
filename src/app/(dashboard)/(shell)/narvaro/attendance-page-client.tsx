'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { correctAttendanceShift, listTodayAttendance, type AttendanceShift, type AttendanceShiftWithUser } from '@shared/lib/api/attendance.api';
import { AttendanceControls } from './attendance-controls';
import { KioskAttendancePanel } from './kiosk-attendance-panel';

function displayName(shift: AttendanceShiftWithUser) {
  return [shift.user.firstName, shift.user.lastName].filter(Boolean).join(' ') || shift.user.email;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function AttendancePageClient({ initialShift }: { initialShift: AttendanceShift | null }) {
  const [shifts, setShifts] = useState<AttendanceShiftWithUser[]>([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

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

  async function saveCorrection(shift: AttendanceShiftWithUser, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingCorrection(true);
    setError('');
    try {
      const clockInAt = String(form.get('clockInAt') ?? '');
      const clockOutAt = String(form.get('clockOutAt') ?? '');
      await correctAttendanceShift(shift.id, {
        clockInAt: new Date(clockInAt).toISOString(),
        clockOutAt: clockOutAt ? new Date(clockOutAt).toISOString() : null,
        status: clockOutAt ? 'corrected' : 'active',
        correctionReason: String(form.get('correctionReason') ?? '').trim(),
      });
      setEditingId('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingCorrection(false);
    }
  }

  return (
    <div className="fluffy-portal-page space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Närvaro"
        description="Stämpla in och ut, och följ dagens närvaro i restaurangen."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <KioskAttendancePanel onChanged={load} />
          <Panel className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Min tid</h2>
            <AttendanceControls initialShift={initialShift} />
          </Panel>
        </div>
        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Dagens pass</h2>
            <Button type="button" variant="ghost" size="compact" onClick={() => void load()}>Uppdatera</Button>
          </div>
          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
          <div className="divide-y divide-[var(--ui-border)]">
            {shifts.length === 0 ? (
              <p className="py-4 text-sm text-[var(--ui-text-muted)]">Inga pass registrerade idag.</p>
            ) : shifts.map((shift) => (
              <div key={shift.id} className="space-y-3 py-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ui-text)]">{displayName(shift)}</p>
                    <p className="text-xs text-[var(--ui-text-muted)]">{shift.user.email}</p>
                  </div>
                  <p className="text-sm tabular-nums text-[var(--ui-text-secondary)]">
                    {new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockInAt))}
                    {shift.clockOutAt ? ` - ${new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(shift.clockOutAt))}` : ''}
                  </p>
                  <StatusBadge tone={shift.status === 'active' ? 'success' : 'neutral'}>{shift.status === 'active' ? 'Aktiv' : 'Klar'}</StatusBadge>
                  <Button type="button" variant="ghost" size="compact" onClick={() => setEditingId(editingId === shift.id ? '' : shift.id)}>
                    Korrigera
                  </Button>
                </div>
                {editingId === shift.id ? (
                  <form onSubmit={(event) => void saveCorrection(shift, event)} className="grid gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3 md:grid-cols-[1fr_1fr_1.2fr_auto] md:items-end">
                    <Input name="clockInAt" type="datetime-local" defaultValue={toDateTimeLocal(shift.clockInAt)} required aria-label="Starttid" />
                    <Input name="clockOutAt" type="datetime-local" defaultValue={toDateTimeLocal(shift.clockOutAt)} aria-label="Sluttid" />
                    <Input name="correctionReason" placeholder="Orsak" required aria-label="Orsak" />
                    <Button type="submit" loading={savingCorrection}>Spara</Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
