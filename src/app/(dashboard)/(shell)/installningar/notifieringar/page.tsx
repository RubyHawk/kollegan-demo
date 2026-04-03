'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SectionCard, Input, Icon } from '../_components/shared';
import type { NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';
import {
  ACTIVE_NOTIFICATION_DEFINITIONS,
  ACTIVE_NOTIFICATION_TAGS,
  NOTIFICATION_SCOPE_DESCRIPTIONS,
  NOTIFICATION_SCOPE_LABELS,
  NOTIFICATION_TAG_SCOPES,
  NOTIFICATION_TAG_REGISTRY,
  PLANNED_NOTIFICATION_DEFINITIONS,
  type ActiveNotificationTag,
  type NotificationTagDefinition,
  type NotificationTagScope,
} from '@modules/supporting/identity/domain/notification-routing';

type RouteState = {
  recipients?: NotificationRecipient[];
  canManage?: boolean;
};

const TONE_CLASSES: Record<NotificationTagDefinition['tone'], string> = {
  emerald: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300',
  red: 'border-rose-500/25 bg-rose-500/8 text-rose-300',
  blue: 'border-sky-500/25 bg-sky-500/8 text-sky-300',
  amber: 'border-amber-500/25 bg-amber-500/8 text-amber-300',
  violet: 'border-violet-500/25 bg-violet-500/8 text-violet-300',
};

const SCOPE_ACCENT_CLASSES: Record<NotificationTagScope, string> = {
  offerter: 'from-[var(--accent)]/18 via-[var(--accent)]/7 to-transparent',
  crm: 'from-sky-500/16 via-sky-500/7 to-transparent',
  kalender: 'from-violet-500/16 via-violet-500/7 to-transparent',
  ekonomi: 'from-amber-500/16 via-amber-500/7 to-transparent',
};

function groupDefinitionsByScope(definitions: NotificationTagDefinition[]) {
  return NOTIFICATION_TAG_SCOPES
    .map((scope) => ({
      scope,
      items: definitions.filter((definition) => definition.scope === scope),
    }))
    .filter((group) => group.items.length > 0);
}

function MetricChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3',
        tone === 'accent'
          ? 'border-[var(--accent)]/30 bg-[var(--accent)]/10'
          : 'border-[var(--border)] bg-[var(--surface-1)]/65',
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function EventBadge({ definition }: { definition: NotificationTagDefinition }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium',
        TONE_CLASSES[definition.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {definition.label}
    </span>
  );
}

function EventCard({
  definition,
  selected = false,
  disabled = false,
  onToggle,
}: {
  definition: NotificationTagDefinition;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  const interactive = !!onToggle && !disabled;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!interactive}
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35',
        interactive
          ? 'hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-[var(--surface-1)]'
          : 'cursor-default',
        selected
          ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_12px_34px_-24px_var(--accent)]'
          : 'border-[var(--border)] bg-[var(--surface-0)]',
        disabled && 'opacity-75',
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', SCOPE_ACCENT_CLASSES[definition.scope])} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]', TONE_CLASSES[definition.tone])}>
              {NOTIFICATION_SCOPE_LABELS[definition.scope]}
            </span>
            {definition.availability === 'planned' && (
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Kommer senare
              </span>
            )}
          </div>
          <div className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{definition.label}</div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{definition.description}</p>
        </div>

        {definition.availability === 'active' && (
          <span
            className={cn(
              'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[var(--text-primary)] transition-all',
              selected
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-0)]',
            )}
          >
            {selected && <Icon path={<polyline points="20 6 9 17 4 12" />} size={12} />}
          </span>
        )}
      </div>
    </button>
  );
}

function RecipientRow({
  recipient,
  canManage,
  onRemove,
  onRemoveTag,
}: {
  recipient: NotificationRecipient;
  canManage: boolean;
  onRemove: () => void;
  onRemoveTag: (tag: ActiveNotificationTag) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)]">{recipient.email}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Får de händelser som är markerade nedan.
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/12"
          >
            <Icon path={<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></>} size={14} />
            Ta bort
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recipient.tags.map((tag) => {
          const definition = NOTIFICATION_TAG_REGISTRY[tag];

          return (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium',
                TONE_CLASSES[definition.tone],
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {definition.label}
              {canManage && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ml-0.5 rounded-full opacity-70 transition-opacity hover:opacity-100"
                  aria-label={`Ta bort ${definition.label}`}
                >
                  <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={10} />
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function NotifieringarPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [pageError, setPageError] = useState('');
  const [addError, setAddError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags] = useState<ActiveNotificationTag[]>([]);

  const activeGroups = useMemo(
    () => groupDefinitionsByScope(ACTIVE_NOTIFICATION_DEFINITIONS),
    [],
  );
  const plannedGroups = useMemo(
    () => groupDefinitionsByScope(PLANNED_NOTIFICATION_DEFINITIONS),
    [],
  );

  const totalAssignments = useMemo(
    () => recipients.reduce((sum, recipient) => sum + recipient.tags.length, 0),
    [recipients],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setPageError('');

      try {
        const response = await fetch('/api/org/notification-recipients', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('load_failed');
        }

        const data = await response.json() as RouteState;
        if (cancelled) return;

        setRecipients(data.recipients ?? []);
        setCanManage(Boolean(data.canManage));
      } catch {
        if (cancelled) return;
        setPageError('Det gick inte att ladda notifieringsrouting just nu.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: NotificationRecipient[]) {
    setSaving(true);
    setSaved(false);
    setPageError('');

    try {
      const response = await fetch('/api/org/notification-recipients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: next }),
      });

      if (!response.ok) {
        throw new Error('save_failed');
      }

      const data = await response.json() as RouteState;
      setRecipients(data.recipients ?? next);
      setCanManage(Boolean(data.canManage));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setPageError('Det gick inte att spara andringarna. Prova igen.');
    } finally {
      setSaving(false);
    }
  }

  function toggleNewTag(tag: ActiveNotificationTag) {
    setNewTags((current) => (
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag]
    ));
  }

  function addRecipient() {
    setAddError('');

    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError('Ange en giltig e-postadress.');
      return;
    }

    if (newTags.length === 0) {
      setAddError('Valj minst en aktiv handelse att koppla adressen till.');
      return;
    }

    if (recipients.some((recipient) => recipient.email === email)) {
      setAddError('Den e-postadressen finns redan i listan.');
      return;
    }

    const next: NotificationRecipient[] = [
      ...recipients,
      {
        id: crypto.randomUUID(),
        email,
        tags: newTags,
      },
    ];

    setNewEmail('');
    setNewTags([]);
    void persist(next);
  }

  function removeRecipient(id: string) {
    void persist(recipients.filter((recipient) => recipient.id !== id));
  }

  function removeTag(recipientId: string, tag: ActiveNotificationTag) {
    const next = recipients
      .map((recipient) => {
        if (recipient.id !== recipientId) return recipient;
        return {
          ...recipient,
          tags: recipient.tags.filter((value) => value !== tag),
        };
      })
      .filter((recipient) => recipient.tags.length > 0);

    void persist(next);
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Notifieringsrouting" description="Styr vilka extra adresser som ska fa interna systemmejl nar viktiga handelser intraffar.">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)]/80 p-5">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,var(--accent)_0%,transparent_60%)] opacity-14" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
                  Organisation
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  E-poststyrning
                </span>
              </div>

              <div className="mt-4 max-w-2xl">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Det ar har du tilldelar extra mottagare till organisationens handelser.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Varje adress kan prenumerera pa en eller flera aktiva handelser. Nar en handelse triggas
                  skickas notisen hit utöver den vanliga ansvariga anvandaren.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricChip label="Aktiva handelser" value={String(ACTIVE_NOTIFICATION_TAGS.length)} tone="accent" />
                <MetricChip label="Mottagare" value={String(recipients.length)} />
                <MetricChip label="Tilldelningar" value={String(totalAssignments)} />
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/90 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Var fungerar det?</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Detta galler hela organisationens notifieringar. Det ar inte per anvandare eller per offert.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/90 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Var tilldelar jag?</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Langre ner pa sidan lagger du till en adress och markerar vilka handelser den ska fa.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]/90 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Vem far andra?</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Organisationsadmins kan justera routingen. Ovrig staff kan se vad som ar kopplat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Atkomst" description="Tydlig rollgrans for vem som bara kan lasa och vem som faktiskt kan uppdatera routingen.">
          <div className="space-y-3">
            <div className={cn(
              'rounded-2xl border p-4',
              canManage
                ? 'border-emerald-500/25 bg-emerald-500/8'
                : 'border-[var(--border)] bg-[var(--surface-1)]/70',
            )}>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <span className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full border',
                  canManage
                    ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-300'
                    : 'border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-muted)]',
                )}>
                  <Icon path={canManage ? <polyline points="20 6 9 17 4 12" /> : <path d="M12 17v.01" />} size={14} />
                </span>
                {canManage ? 'Du kan uppdatera routing' : 'Laslage'}
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {canManage
                  ? 'Du har organisationsadmin-behorighet och kan lagga till, ta bort och tilldela mottagare.'
                  : 'Du kan se vilka adresser och handelser som ar kopplade, men andringar kravs admin-behorighet.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nuvarande scope</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIVE_NOTIFICATION_DEFINITIONS.map((definition) => (
                  <EventBadge key={definition.tag} definition={definition} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Aktiva handelser" description="Detta ar de handelser som kan kopplas direkt idag. Nya kategorier kan laggas till utan att bygga om sjalva routingsidan.">
        <div className="space-y-4">
          {activeGroups.map(({ scope, items }) => (
            <div key={scope} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{NOTIFICATION_SCOPE_LABELS[scope]}</div>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{NOTIFICATION_SCOPE_DESCRIPTIONS[scope]}</p>
                </div>
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {items.length} aktiv{items.length === 1 ? '' : 'a'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {items.map((definition) => (
                  <EventCard key={definition.tag} definition={definition} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Tilldela mottagare" description="Lagg till en adress och markera vilka aktiva handelser den ska fa e-post for.">
          <div className="space-y-5">
            {!canManage && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 p-4 text-sm leading-6 text-[var(--text-secondary)]">
                Du ar i laslage. Be en organisationsadmin att lagga till eller justera mottagare har.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Extra mottagare
              </label>
              <Input
                value={newEmail}
                onChange={canManage ? setNewEmail : undefined}
                placeholder="namn@foretag.se"
                type="email"
                readOnly={!canManage}
              />
              <p className="text-xs leading-5 text-[var(--text-muted)]">
                Denna adress far organisationens interna notifieringar utöver ansvarig anvandare.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Aktiva handelser att koppla
                </label>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Valj en eller flera handelser. Du kan alltid finjustera eller ta bort kopplingen senare.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {ACTIVE_NOTIFICATION_DEFINITIONS.map((definition) => (
                  <EventCard
                    key={definition.tag}
                    definition={definition}
                    selected={newTags.includes(definition.tag)}
                    disabled={!canManage}
                    onToggle={canManage ? () => toggleNewTag(definition.tag) : undefined}
                  />
                ))}
              </div>
            </div>

            {addError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-300">
                {addError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addRecipient}
                disabled={!canManage || saving}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35',
                  canManage && !saving
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] hover:border-[var(--accent-light)]'
                    : 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)]',
                )}
              >
                <Icon path={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} size={14} />
                {saving ? 'Sparar...' : 'Lagg till mottagare'}
              </button>

              <span className="text-xs text-[var(--text-muted)]">
                Nya handelser dyker upp har automatiskt nar systemet byggs ut.
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Nuvarande mottagare" description="Sa ser routingen ut just nu for organisationen.">
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Laddar notifieringsrouting...</p>
          ) : recipients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/60 px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-muted)]">
                <Icon path={<><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></>} size={18} />
              </div>
              <div className="mt-4 text-sm font-semibold text-[var(--text-primary)]">Inga extra mottagare anlagda an.</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Nar du lagger till en adress hamnar den har tillsammans med sina kopplade handelser.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient) => (
                <RecipientRow
                  key={recipient.id}
                  recipient={recipient}
                  canManage={canManage}
                  onRemove={() => removeRecipient(recipient.id)}
                  onRemoveTag={(tag) => removeTag(recipient.id, tag)}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Kommande notifieringsytor" description="Dessa event ar inte live an, men registret ar redan forberett sa att sidan kan vaxa utan en ny redesign.">
        <div className="space-y-4">
          {plannedGroups.map(({ scope, items }) => (
            <div key={scope} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/45 p-4">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{NOTIFICATION_SCOPE_LABELS[scope]}</div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{NOTIFICATION_SCOPE_DESCRIPTIONS[scope]}</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {items.map((definition) => (
                  <EventCard key={definition.tag} definition={definition} disabled />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            <Icon path={<polyline points="20 6 9 17 4 12" />} size={14} />
            Sparat
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pageError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-40 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-rose-500/25 bg-rose-500/95 px-4 py-3 text-sm text-white shadow-lg"
          >
            {pageError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
