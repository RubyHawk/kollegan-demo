'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
import { PlusIcon } from '@shared/ui/icons';
import {
  createChecklistTask,
  listChecklistTasks,
  updateChecklistTask,
  type ChecklistTask,
} from '@shared/lib/api/tasks.api';

function formatDue(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function isOverdue(task: ChecklistTask) {
  return !task.completedAt && !!task.dueAt && new Date(task.dueAt) < new Date();
}

export function TasksClient({ canWrite }: { canWrite: boolean }) {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await listChecklistTasks(true));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openTasks = useMemo(() => tasks.filter((task) => !task.completedAt), [tasks]);
  const completedTasks = useMemo(
    () => tasks.filter((task) => !!task.completedAt).slice(-10).reverse(),
    [tasks],
  );

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const due = String(form.get('dueAt') ?? '');
    setSaving(true);
    setError('');
    try {
      await createChecklistTask({
        title: String(form.get('title') ?? ''),
        area: String(form.get('area') ?? '') || null,
        dueAt: due ? new Date(due).toISOString() : null,
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function setCompleted(id: string, completed: boolean) {
    setSaving(true);
    setError('');
    try {
      await updateChecklistTask(id, { completed });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function renderTask(task: ChecklistTask) {
    const due = formatDue(task.dueAt);
    return (
      <article key={task.id} className="flex items-start gap-3 py-2">
        <input
          type="checkbox"
          checked={!!task.completedAt}
          disabled={!canWrite || saving}
          onChange={(event) => void setCompleted(task.id, event.target.checked)}
          aria-label={task.completedAt ? `Återöppna ${task.title}` : `Slutför ${task.title}`}
          className="mt-1 size-4 accent-[var(--ui-primary)]"
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className={`text-sm ${task.completedAt ? 'text-[var(--ui-text-muted)] line-through' : 'font-medium text-[var(--ui-text)]'}`}>
            {task.title}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-text-muted)]">
            {task.area ? <span>{task.area}</span> : null}
            {due ? <span>Senast {due}</span> : null}
            {isOverdue(task) ? <StatusBadge tone="danger">Försenad</StatusBadge> : null}
          </p>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Uppgifter"
        description="Öppningslistor, stängningslistor och dagens att-göra för hela teamet."
      />

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--ui-text)]">Att göra</h2>
              <StatusBadge tone={openTasks.length > 0 ? 'warning' : 'success'}>{openTasks.length} öppna</StatusBadge>
            </div>
            {loading ? (
              <p className="text-sm text-[var(--ui-text-muted)]">Laddar uppgifter…</p>
            ) : openTasks.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-muted)]">Allt är klart. Inga öppna uppgifter.</p>
            ) : (
              <div className="divide-y divide-[var(--ui-border)]">{openTasks.map(renderTask)}</div>
            )}
          </Panel>

          {completedTasks.length > 0 ? (
            <Panel className="space-y-2">
              <h2 className="text-sm font-semibold text-[var(--ui-text)]">Nyligen slutförda</h2>
              <div className="divide-y divide-[var(--ui-border)]">{completedTasks.map(renderTask)}</div>
            </Panel>
          ) : null}
        </div>

        {canWrite ? (
          <Panel className="h-fit space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny uppgift</h2>
            <form onSubmit={createTask} className="space-y-3">
              <Input name="title" placeholder="Vad behöver göras?" required maxLength={200} />
              <Input name="area" placeholder="Område, ex. Kök eller Servering" maxLength={80} />
              <Input name="dueAt" type="datetime-local" />
              <Button type="submit" loading={saving}>
                <PlusIcon />
                Lägg till uppgift
              </Button>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
