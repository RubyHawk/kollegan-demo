'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Ban, CalendarDays, CheckCircle, ChevronDown, ChevronUp, ExternalLink, LoaderCircle, Play, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';
import {
  createMeeting,
  deleteMeeting as deleteMeetingRequest,
  listMeetings,
  updateMeeting,
  type Meeting,
  type MeetingProvider,
  type MeetingStatus,
} from '@shared/lib/api/meetings.api';

const STATUS_LABEL: Record<MeetingStatus, string> = {
  scheduled: 'Schemalagd',
  in_progress: 'Pågår',
  completed: 'Avslutad',
  cancelled: 'Inställd',
};

const STATUS_TONE: Record<MeetingStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

const STATUS_TABS: { id: MeetingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'scheduled', label: 'Schemalagda' },
  { id: 'in_progress', label: 'Pågår' },
  { id: 'completed', label: 'Avslutade' },
  { id: 'cancelled', label: 'Inställda' },
];

const PROVIDER_LABEL: Record<MeetingProvider, string> = {
  manual: 'Manuellt',
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  daily: 'Daily',
};

type MeetingFormState = {
  title: string;
  scheduledAt: string;
  provider: MeetingProvider;
  meetingUrl: string;
  agenda: string;
};

const EMPTY_FORM: MeetingFormState = {
  title: '',
  scheduledAt: '',
  provider: 'manual',
  meetingUrl: '',
  agenda: '',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtDuration = (secs: number | null) => {
  if (!secs) return null;
  const minutes = Math.floor(secs / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MeetingStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MeetingFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDeleteMeeting, setConfirmDeleteMeeting] = useState<Meeting | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await listMeetings({ limit: 50, offset: 0, status: tab === 'all' ? undefined : tab });
      setMeetings(result.meetings);
      setTotal(result.total);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMeeting = useCallback(async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      setError('Titel och tid krävs.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createMeeting({
        title: form.title.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        provider: form.provider,
        meetingUrl: form.meetingUrl.trim() || undefined,
        agenda: form.agenda.trim() || undefined,
        participants: [],
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const updateStatus = useCallback(async (id: string, status: MeetingStatus) => {
    setActing(id);
    try {
      await updateMeeting(id, { status });
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setActing(null);
    }
  }, [load]);

  const deleteMeeting = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteMeetingRequest(id);
      await load(true);
    } catch {
      setError('Något gick fel. Kontrollera anslutningen och försök igen.');
    } finally {
      setActing(null);
      setConfirmDeleteMeeting(null);
    }
  }, [load]);

  const upcoming = meetings.filter((meeting) => meeting.status === 'scheduled' || meeting.status === 'in_progress').length;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold text-[var(--ui-text)]">Möten</h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">Schemalägg och följ upp möten.</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="neutral">{total} möten totalt</StatusBadge>
            {upcoming > 0 ? <StatusBadge tone="accent">{upcoming} kommande</StatusBadge> : null}
          </div>
        </div>
        <Button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setError(null);
          }}
        >
          <Plus size={16} strokeWidth={1.75} />
          Nytt möte
        </Button>
      </header>

      {error ? (
        <InlineAlert tone="danger" title="Möten kunde inte uppdateras">
          <div className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button type="button" variant="secondary" size="compact" onClick={() => setError(null)}>
              <X size={16} strokeWidth={1.75} />
              Stäng
            </Button>
          </div>
        </InlineAlert>
      ) : null}

      {showForm ? (
        <MeetingForm
          form={form}
          saving={saving}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setError(null);
          }}
          onSave={() => void saveMeeting()}
        />
      ) : null}

      <Panel padding="sm">
        <div className="flex gap-1 overflow-x-auto rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-1">
          {STATUS_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'h-8 whitespace-nowrap rounded-[var(--ui-radius-sm)] px-3 text-sm font-medium text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
                tab === item.id && 'border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-text)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Panel>

      {loading ? (
        <Panel className="grid min-h-64 place-items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <LoaderCircle size={18} strokeWidth={1.75} className="animate-spin" />
            Laddar möten...
          </div>
        </Panel>
      ) : meetings.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title={tab !== 'all' ? `Inga möten med status ${STATUS_LABEL[tab].toLowerCase()}` : 'Inga möten ännu'}
            description="Klicka på Nytt möte för att schemalägga."
            actionLabel="Nytt möte"
            onAction={() => setShowForm(true)}
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              acting={acting === meeting.id}
              expanded={expanded === meeting.id}
              onToggleExpanded={() => setExpanded((value) => (value === meeting.id ? null : meeting.id))}
              onStart={() => void updateStatus(meeting.id, 'in_progress')}
              onComplete={() => void updateStatus(meeting.id, 'completed')}
              onCancel={() => void updateStatus(meeting.id, 'cancelled')}
              onDelete={() => setConfirmDeleteMeeting(meeting)}
            />
          ))}
        </div>
      )}

      {total > meetings.length ? (
        <p className="text-center text-xs text-[var(--ui-text-muted)]">Visar {meetings.length} av {total} möten</p>
      ) : null}

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteMeeting)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteMeeting(null);
        }}
        title="Ta bort möte?"
        description={
          confirmDeleteMeeting
            ? `"${confirmDeleteMeeting.title}" tas bort permanent. Det här går inte att ångra.`
            : 'Mötet tas bort permanent. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort möte"
        loading={Boolean(confirmDeleteMeeting && acting === confirmDeleteMeeting.id)}
        onConfirm={() => {
          if (!confirmDeleteMeeting) return;
          void deleteMeeting(confirmDeleteMeeting.id);
        }}
      />
    </div>
  );
}

function MeetingForm({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: MeetingFormState;
  saving: boolean;
  onChange: (next: MeetingFormState | ((current: MeetingFormState) => MeetingFormState)) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const setField = <Key extends keyof MeetingFormState>(key: Key, value: MeetingFormState[Key]) => {
    onChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <Panel variant="selected" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">Nytt möte</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Stäng formulär">
          <X size={16} strokeWidth={1.75} />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titel *" className="sm:col-span-2">
          <Input value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="t.ex. Sprint Review Q2" />
        </Field>
        <Field label="Datum & tid *">
          <Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setField('scheduledAt', event.target.value)} />
        </Field>
        <Field label="Plattform">
          <Select value={form.provider} onValueChange={(value) => setField('provider', value as MeetingProvider)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(PROVIDER_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Möteslänk" className="sm:col-span-2">
          <Input value={form.meetingUrl} onChange={(event) => setField('meetingUrl', event.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Agenda" className="sm:col-span-2">
          <Textarea rows={3} value={form.agenda} onChange={(event) => setField('agenda', event.target.value)} placeholder="Mötespunkter..." />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--ui-border)] pt-3">
        <Button type="button" onClick={onSave} disabled={saving} loading={saving}>Schemalägg möte</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Avbryt</Button>
      </div>
    </Panel>
  );
}

function MeetingCard({
  meeting,
  acting,
  expanded,
  onToggleExpanded,
  onStart,
  onComplete,
  onCancel,
  onDelete,
}: {
  meeting: Meeting;
  acting: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const hasDetails = Boolean(meeting.agenda || meeting.summary || meeting.meetingUrl);

  return (
    <Panel padding="none" className={cn('overflow-hidden transition-opacity', acting && 'opacity-60')}>
      <div className="space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{meeting.title}</p>
              <StatusBadge tone={STATUS_TONE[meeting.status]}>{STATUS_LABEL[meeting.status]}</StatusBadge>
            </div>
            <p className="text-xs text-[var(--ui-text-muted)]">
              {fmtDate(meeting.scheduledAt)}
              {meeting.durationSeconds ? ` · ${fmtDuration(meeting.durationSeconds)}` : ''}
              {meeting.participants.length > 0 ? ` · ${meeting.participants.length} deltagare` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {meeting.status === 'scheduled' ? <ActionButton icon={Play} label="Starta" disabled={acting} onClick={onStart} /> : null}
            {meeting.status === 'in_progress' ? <ActionButton icon={CheckCircle} label="Avsluta" disabled={acting} onClick={onComplete} /> : null}
            {meeting.status === 'scheduled' ? <ActionButton icon={Ban} label="Ställ in" disabled={acting} onClick={onCancel} /> : null}
            <ActionButton icon={Trash2} label="Ta bort" disabled={acting} onClick={onDelete} danger />
            {hasDetails ? (
              <Button type="button" variant="ghost" size="icon" onClick={onToggleExpanded} aria-label={expanded ? 'Dölj detaljer' : 'Visa detaljer'}>
                {expanded ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
              </Button>
            ) : null}
          </div>
        </div>
        {meeting.meetingUrl ? (
          <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ui-accent)] hover:underline">
            <ExternalLink size={14} strokeWidth={1.75} />
            Gå med i mötet
          </a>
        ) : null}
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-[var(--ui-border)] px-4 py-3">
          {meeting.agenda ? <DetailBlock title="Agenda">{meeting.agenda}</DetailBlock> : null}
          {meeting.summary?.summary ? <DetailBlock title="Sammanfattning (AI)">{meeting.summary.summary}</DetailBlock> : null}
          {meeting.participants.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]">Deltagare</p>
              <div className="flex flex-wrap gap-1.5">
                {meeting.participants.map((participant) => (
                  <StatusBadge key={participant.id} tone="neutral">
                    {participant.name}{participant.email ? ` (${participant.email})` : ''}
                  </StatusBadge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function ActionButton({ icon: Icon, label, disabled, onClick, danger = false }: { icon: typeof Play; label: string; disabled: boolean; onClick: () => void; danger?: boolean }) {
  return (
    <Button type="button" variant={danger ? 'destructive' : 'secondary'} size="compact" onClick={onClick} disabled={disabled}>
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </Button>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[var(--ui-text-secondary)]">{title}</p>
      <p className="whitespace-pre-line text-xs leading-5 text-[var(--ui-text-muted)]">{children}</p>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={cn('space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]', className)}><span>{label}</span>{children}</label>;
}
