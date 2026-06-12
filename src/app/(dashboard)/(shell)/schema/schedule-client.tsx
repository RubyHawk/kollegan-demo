'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Skeleton } from '@shared/ui/skeleton';
import { StatusBadge } from '@shared/ui/status-badge';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@shared/ui/icons';
import {
  createScheduleShift,
  listScheduleMembers,
  listScheduleShifts,
  updateScheduleShift,
  type ScheduleMember,
  type ScheduleShift,
} from '@shared/lib/api/schedule.api';

const SELECT_CLASS =
  'h-10 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]';

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function memberName(member: { firstName: string | null; lastName: string | null; email: string }) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDayHeading(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
}

function formatWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const format = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
  return `${format.format(weekStart)} - ${format.format(weekEnd)}`;
}

const STATUS_TONE: Record<ScheduleShift['status'], 'info' | 'success' | 'neutral'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

const STATUS_LABEL: Record<ScheduleShift['status'], string> = {
  scheduled: 'Planerat',
  completed: 'Slutfört',
  cancelled: 'Inställt',
};

export function ScheduleClient({ canEdit, currentUserId }: { canEdit: boolean; currentUserId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [members, setMembers] = useState<ScheduleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (start: Date) => {
    setLoading(true);
    try {
      const next = await listScheduleShifts(start.toISOString(), addDays(start, 7).toISOString());
      setShifts(next);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(weekStart);
  }, [weekStart, load]);

  useEffect(() => {
    if (!canEdit) return;
    listScheduleMembers().then(setMembers).catch(() => setMembers([]));
  }, [canEdit]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        const dayShifts = shifts.filter(
          (shift) => new Date(shift.startsAt) >= date && new Date(shift.startsAt) < addDays(date, 1),
        );
        return { date, shifts: dayShifts };
      }),
    [weekStart, shifts],
  );

  async function createShift(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get('date') ?? '');
    const startTime = String(form.get('startTime') ?? '');
    const endTime = String(form.get('endTime') ?? '');
    if (!date || !startTime || !endTime) return;

    setSaving(true);
    setError('');
    try {
      await createScheduleShift({
        userId: String(form.get('userId') ?? ''),
        startsAt: new Date(`${date}T${startTime}`).toISOString(),
        endsAt: new Date(`${date}T${endTime}`).toISOString(),
        roleLabel: String(form.get('roleLabel') ?? '') || null,
      });
      event.currentTarget.reset();
      await load(weekStart);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function setShiftStatus(id: string, status: ScheduleShift['status']) {
    setSaving(true);
    setError('');
    try {
      await updateScheduleShift(id, { status });
      await load(weekStart);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Schema"
        description={canEdit
          ? 'Planera arbetspass per medarbetare och vecka.'
          : 'Dina och kollegornas planerade arbetspass.'}
      />

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="compact" onClick={() => setWeekStart((current) => addDays(current, -7))}>
          <ChevronLeftIcon />
          Föregående
        </Button>
        <span className="min-w-32 text-center text-sm font-medium text-[var(--ui-text)]">{formatWeekLabel(weekStart)}</span>
        <Button type="button" variant="secondary" size="compact" onClick={() => setWeekStart((current) => addDays(current, 7))}>
          Nästa
          <ChevronRightIcon />
        </Button>
        <Button type="button" variant="ghost" size="compact" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          Idag
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="space-y-4">
          {loading ? (
            <div className="space-y-3" aria-label="Laddar schema" role="status">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            days.map(({ date, shifts: dayShifts }) => (
              <section key={date.toISOString()} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">{formatDayHeading(date)}</h2>
                {dayShifts.length === 0 ? (
                  <p className="text-sm text-[var(--ui-text-muted)]">Inga pass.</p>
                ) : (
                  <div className="divide-y divide-[var(--ui-border)]">
                    {dayShifts.map((shift) => (
                      <article key={shift.id} className="grid gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-[var(--ui-text)]">
                              {memberName(shift.user)}
                              {shift.userId === currentUserId ? ' (du)' : ''}
                            </p>
                            <StatusBadge tone={STATUS_TONE[shift.status]}>{STATUS_LABEL[shift.status]}</StatusBadge>
                          </div>
                          <p className="text-xs text-[var(--ui-text-muted)]">
                            {formatTime(shift.startsAt)} - {formatTime(shift.endsAt)}
                            {shift.roleLabel ? ` · ${shift.roleLabel}` : ''}
                          </p>
                        </div>
                        {canEdit && shift.status === 'scheduled' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="compact"
                            disabled={saving}
                            onClick={() => void setShiftStatus(shift.id, 'cancelled')}
                          >
                            Ställ in
                          </Button>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </Panel>

        {canEdit ? (
          <Panel className="h-fit space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Nytt pass</h2>
            <form onSubmit={createShift} className="space-y-3">
              <select name="userId" className={SELECT_CLASS} required defaultValue="" aria-label="Välj medarbetare">
                <option value="" disabled>Välj medarbetare</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{memberName(member)}</option>
                ))}
              </select>
              <Input name="date" type="date" defaultValue={toDateInputValue(new Date())} required />
              <div className="grid grid-cols-2 gap-2">
                <Input name="startTime" type="time" required />
                <Input name="endTime" type="time" required />
              </div>
              <Input name="roleLabel" placeholder="Roll, ex. Kök eller Kassa" />
              <Button type="submit" loading={saving}>
                <PlusIcon />
                Lägg till pass
              </Button>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
