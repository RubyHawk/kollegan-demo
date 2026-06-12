'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@shared/lib/api-client';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import { Badge } from '@shared/ui/badge';
import { ClockIcon, LockIcon } from '@shared/ui/icons';
import {
  kioskClockIn,
  kioskClockOut,
  listKioskClockableStaff,
  type ClockableStaffMember,
} from '@shared/lib/api/attendance.api';

function nameOf(member: ClockableStaffMember) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.employeeCode || member.email;
}

function time(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function KioskAttendancePanel({ onChanged }: { onChanged: () => Promise<void> }) {
  const [available, setAvailable] = useState(true);
  const [staff, setStaff] = useState<ClockableStaffMember[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => staff.find((member) => member.id === selectedId) ?? staff[0] ?? null,
    [staff, selectedId],
  );

  async function load() {
    try {
      const next = await listKioskClockableStaff();
      setStaff(next);
      setSelectedId((current) => current && next.some((member) => member.id === current) ? current : next[0]?.id ?? '');
      setAvailable(true);
      setError('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAvailable(false);
        return;
      }
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(action: 'in' | 'out') {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const payload = { userId: selected.id, pin, deviceLabel: 'Portal kiosk' };
      if (action === 'in') await kioskClockIn(payload);
      else await kioskClockOut(payload);
      setPin('');
      await load();
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!available) return null;

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">Kiosk</h2>
        <Badge variant="neutral">{staff.length} personer</Badge>
      </div>
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="grid max-h-[20rem] gap-2 overflow-auto pr-1">
        {staff.length === 0 ? (
          <p className="text-sm text-[var(--ui-text-muted)]">Lägg upp personal och PIN-koder innan kiosken kan användas.</p>
        ) : staff.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => setSelectedId(member.id)}
            className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-left hover:bg-[var(--ui-surface-hover)] data-[selected=true]:border-[var(--ui-accent-border)] data-[selected=true]:bg-[var(--ui-surface-selected)]"
            data-selected={selected?.id === member.id}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--ui-text)]">{nameOf(member)}</span>
              <span className="block truncate text-xs text-[var(--ui-text-muted)]">{member.employeeCode ?? displayCodeFallback(member.email)}</span>
            </span>
            <Badge variant={member.activeShift ? 'success' : 'neutral'}>
              {member.activeShift ? `In ${time(member.activeShift.clockInAt)}` : 'Ute'}
            </Badge>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
        <div>
          <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Vald person</p>
          <p className="text-sm font-semibold text-[var(--ui-text)]">{selected ? nameOf(selected) : 'Ingen vald'}</p>
        </div>
        <Input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          inputMode="numeric"
          pattern="\d{4,8}"
          placeholder="PIN"
          aria-label="PIN"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void run('in')}
            disabled={!selected || Boolean(selected.activeShift) || pin.length < 4}
            loading={loading}
          >
            <ClockIcon />
            Stämpla in
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void run('out')}
            disabled={!selected?.activeShift || pin.length < 4}
            loading={loading}
          >
            <LockIcon />
            Stämpla ut
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function displayCodeFallback(email: string) {
  return email.endsWith('@staff.local.invalid') ? 'Ingen kod' : email;
}
