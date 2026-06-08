'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClockIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import type { TimeEntry } from '@shared/lib/api/time-entries.api';
import { fmtDate } from '../_lib/project-display';
import { useProjectTimeStore } from '../_store/project-time.store';
import { LogTimePanel, type TimeEntryFormValues } from './log-time-panel';

function fmtHours(hours: number): string {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(hours)} h`;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface-alt)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function ProjectTimeCard({ projectId }: { projectId: string }) {
  const entries = useProjectTimeStore((s) => s.entries);
  const currentUserId = useProjectTimeStore((s) => s.currentUserId);
  const loading = useProjectTimeStore((s) => s.loading);
  const saving = useProjectTimeStore((s) => s.saving);
  const error = useProjectTimeStore((s) => s.error);
  const setError = useProjectTimeStore((s) => s.setError);
  const loadEntries = useProjectTimeStore((s) => s.loadEntries);
  const saveEntry = useProjectTimeStore((s) => s.saveEntry);
  const deleteEntry = useProjectTimeStore((s) => s.deleteEntry);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  useEffect(() => {
    void loadEntries(projectId);
  }, [loadEntries, projectId]);

  const summary = useMemo(() => {
    let total = 0;
    let billable = 0;
    let unbilled = 0;
    for (const entry of entries) {
      total += entry.hours;
      if (entry.billable) {
        billable += entry.hours;
        if (!entry.invoiceId) unbilled += entry.hours;
      }
    }
    return { total, billable, unbilled };
  }, [entries]);

  function canEdit(entry: TimeEntry): boolean {
    // Own entries are always editable; admins may edit others — enforced server-side.
    return currentUserId === null || entry.userId === currentUserId;
  }

  function openCreate() {
    setEditing(null);
    setError(null);
    setPanelOpen(true);
  }

  function openEdit(entry: TimeEntry) {
    setEditing(entry);
    setError(null);
    setPanelOpen(true);
  }

  async function onSubmit(values: TimeEntryFormValues) {
    try {
      await saveEntry(projectId, values, editing?.id);
      setPanelOpen(false);
      setEditing(null);
    } catch {
      // Error is surfaced inside the panel via the store error state.
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEntry(projectId, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error stays in the store; close the confirm so the inline error is visible.
      setDeleteTarget(null);
    }
  }

  return (
    <Card className="border-[var(--border)]">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Tid</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{'Loggade timmar på projektet.'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon />
          {'Logga tid'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TODO (M3): "Skapa faktura från tid" action goes here once invoicing exists. */}
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Totalt" value={fmtHours(summary.total)} />
          <SummaryStat label="Debiterbart" value={fmtHours(summary.billable)} />
          <SummaryStat label="Ej fakturerat" value={fmtHours(summary.unbilled)} />
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-primary)]">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              {'Stäng'}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {entries.map((entry) => {
            const who = currentUserId && entry.userId === currentUserId ? 'Du' : entry.userId;
            const editable = canEdit(entry);
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{fmtDate(entry.date)}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{fmtHours(entry.hours)}</span>
                    {entry.billable ? (
                      <Badge variant="secondary">{'Debiterbar'}</Badge>
                    ) : (
                      <Badge variant="outline">{'Ej debiterbar'}</Badge>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-sm text-[var(--text-secondary)]">{entry.description}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">{who}</p>
                </div>
                {editable && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(entry)} aria-label="Redigera tid">
                      <PencilSimpleIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(entry)}
                      aria-label="Ta bort tid"
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <ClockIcon size={16} />
                  {'Laddar tid...'}
                </span>
              ) : (
                'Ingen tid loggad ännu.'
              )}
            </div>
          )}
        </div>
      </CardContent>

      <LogTimePanel
        key={editing ? `edit-${editing.id}` : `create-${panelOpen}`}
        open={panelOpen}
        onOpenChange={(open) => {
          setPanelOpen(open);
          if (!open) setEditing(null);
        }}
        entry={editing}
        saving={saving}
        error={error}
        onSubmit={onSubmit}
      />

      <ConfirmDestructiveDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Ta bort tidpost?"
        description={'Det här går inte att ångra.'}
        loading={saving}
        onConfirm={onConfirmDelete}
      />
    </Card>
  );
}
