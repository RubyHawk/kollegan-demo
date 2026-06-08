'use client';

import { useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import type { TimeEntry } from '@shared/lib/api/time-entries.api';

export interface TimeEntryFormValues {
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
}

interface LogTimePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set the panel edits this entry; otherwise it logs a new one. */
  entry: TimeEntry | null;
  saving: boolean;
  /** Server-side error to surface (e.g. a 403 on a non-owner edit). */
  error: string | null;
  onSubmit: (values: TimeEntryFormValues) => void;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Log/edit panel for a project time entry. Used for both create and edit:
 * `entry === null` → create (date defaults to today, billable on); otherwise the
 * form is seeded from the entry. The parent remounts this via a `key` so the
 * initializers below re-run on open instead of resetting inside an effect.
 */
export function LogTimePanel({ open, onOpenChange, entry, saving, error, onSubmit }: LogTimePanelProps) {
  const [date, setDate] = useState<string>(() => entry?.date ?? todayInput());
  const [hours, setHours] = useState<string>(() => (entry ? String(entry.hours) : ''));
  const [description, setDescription] = useState<string>(() => entry?.description ?? '');
  const [billable, setBillable] = useState<boolean>(() => entry?.billable ?? true);
  const [localError, setLocalError] = useState<string | null>(null);

  const isEdit = Boolean(entry);

  function handleSubmit() {
    const trimmedDate = date.trim();
    if (!trimmedDate) {
      setLocalError('Välj ett datum.');
      return;
    }
    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      setLocalError('Timmar måste vara mer än 0 och högst 24.');
      return;
    }
    setLocalError(null);
    onSubmit({
      date: trimmedDate,
      hours: parsedHours,
      description: description.trim() || null,
      billable,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" className="sm:max-w-md">
        <DialogHeader className="border-b border-[var(--border)] pb-4">
          <DialogTitle>{isEdit ? 'Redigera tid' : 'Logga tid'}</DialogTitle>
          <p className="text-sm text-[var(--text-muted)]">
            {'Registrera arbetad tid på projektet.'}
          </p>
        </DialogHeader>

        <div className="space-y-4 bg-[var(--surface-alt)] px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--text-secondary)]">Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[var(--text-secondary)]">Timmar</Label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.25}
                placeholder="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[var(--text-secondary)]">Beskrivning</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vad gjordes? (valfritt)"
              className="min-h-24 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-3.5 py-3 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            {'Debiterbar tid'}
          </label>

          {(localError || error) && (
            <p className="rounded-xl border border-[var(--status-danger-bg)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
              {localError ?? error}
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-[var(--border)] pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Logga tid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
