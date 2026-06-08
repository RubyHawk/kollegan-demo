'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle, Plus, Trash, TriangleAlert, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  ACTIVE_NOTIFICATION_DEFINITIONS,
  ACTIVE_NOTIFICATION_TAGS,
  type ActiveNotificationTag,
  getNotificationRecipients,
  updateNotificationRecipients,
  type NotificationRecipient,
} from '@shared/lib/api/settings.api';

const TONE_PILL: Record<string, string> = {
  emerald: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
  red: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
};

const TONE_ACTIVE: Record<string, string> = {
  emerald: 'border-[var(--ui-success-text)] bg-[var(--ui-success-text)] text-[var(--ui-text-inverse)]',
  red: 'border-[var(--ui-danger-text)] bg-[var(--ui-danger-text)] text-[var(--ui-text-inverse)]',
};

export default function NotifieringarPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [canManage, setCanManage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags] = useState<ActiveNotificationTag[]>([]);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    getNotificationRecipients()
      .then((data) => {
        setRecipients(data.recipients ?? []);
        setCanManage(Boolean(data.canManage ?? true));
      })
      .catch((fetchError) =>
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Kunde inte hämta notifieringsinställningarna. Försök ladda om sidan.',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: NotificationRecipient[]) {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const data = await updateNotificationRecipients(next);
      setRecipients(data.recipients ?? next);
      setCanManage(Boolean(data.canManage ?? true));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kunde inte spara. Försök igen.');
    } finally {
      setSaving(false);
    }
  }

  function addRecipient() {
    setAddError('');

    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddError('Ange en giltig e-postadress.');
      return;
    }
    if (newTags.length === 0) {
      setAddError('Välj minst en händelsetyp.');
      return;
    }
    if (recipients.some((recipient) => recipient.email === email)) {
      setAddError('Adressen finns redan i listan.');
      return;
    }

    void persist([...recipients, { id: crypto.randomUUID(), email, tags: newTags }]);
    setNewEmail('');
    setNewTags([]);
  }

  function remove(id: string) {
    void persist(recipients.filter((recipient) => recipient.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-[var(--ui-text-muted)]">Laddar notifieringskopplingar...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
            <Bell aria-hidden="true" size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[var(--ui-text)]">Interna notifieringsmottagare</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">
              Lägg till valfria e-postadresser som ska få interna notiser när en offert accepteras eller avvisas.
              Adressen behöver inte vara kopplad till ett konto i systemet.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] px-4 py-2.5 text-sm text-[var(--ui-danger-text)]">
          <TriangleAlert aria-hidden="true" size={15} strokeWidth={2} className="shrink-0" />
          {error}
          <button type="button" onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">
            <X aria-hidden="true" size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)]">
        <div className="flex items-center gap-2 border-b border-[var(--ui-border-subtle)] px-5 py-3.5">
          <Bell aria-hidden="true" size={14} strokeWidth={1.75} className="text-[var(--ui-accent)]" />
          <p className="text-sm font-semibold text-[var(--ui-text)]">Aktiva kopplingar</p>
          <span className="ml-auto text-xs text-[var(--ui-text-muted)]">
            {recipients.length === 0 ? 'Inga tillagda' : `${recipients.length} kopplingar`}
          </span>
        </div>

        {recipients.length > 0 ? (
          <div className="divide-y divide-[var(--ui-border-subtle)]">
            <AnimatePresence initial={false}>
              {recipients.map((recipient) => (
                <motion.div
                  key={recipient.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.14 }}
                  className="overflow-hidden px-5 py-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{recipient.email}</p>
                      <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                        Får notifieringar för markerade händelser utan att behöva ha ett konto i systemet.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(recipient.tags as ActiveNotificationTag[]).map((tag) => {
                        const definition = ACTIVE_NOTIFICATION_DEFINITIONS.find((item) => item.tag === tag);
                        if (!definition) return null;

                        return (
                          <span
                            key={tag}
                            className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', TONE_PILL[definition.tone])}
                          >
                            {definition.label}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(recipient.id)}
                      disabled={saving || !canManage}
                      className="shrink-0 rounded-lg p-1 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)] disabled:opacity-40"
                      aria-label="Ta bort koppling"
                    >
                      <Trash aria-hidden="true" size={13} strokeWidth={2} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="px-5 py-5 text-sm text-[var(--ui-text-muted)]">
            Inga extra mottagare är tillagda ännu. Offertens ansvariga användare notifieras alltid separat.
          </div>
        )}

        <div className={cn('px-5 py-4', recipients.length > 0 && 'border-t border-[var(--ui-border-subtle)]')}>
          <p className="mb-3 text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Lägg till mottagare</p>

          <div className="flex flex-col gap-2.5">
            <input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addRecipient()}
              placeholder="namn@foretag.se"
              disabled={!canManage}
              className="w-full rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="text-xs leading-relaxed text-[var(--ui-text-muted)]">
              Den här adressen får organisationens interna notifieringar utöver offertens ansvariga användare. Inget konto krävs.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {ACTIVE_NOTIFICATION_TAGS.map((tag) => {
                const definition = ACTIVE_NOTIFICATION_DEFINITIONS.find((item) => item.tag === tag);
                if (!definition) return null;

                const active = newTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setNewTags((current) =>
                        current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
                      )
                    }
                    disabled={!canManage}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      active
                        ? TONE_ACTIVE[definition.tone]
                        : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-accent)] hover:text-[var(--ui-accent)]',
                      !canManage && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {definition.label}
                  </button>
                );
              })}
            </div>

            {addError && <p className="text-xs text-[var(--ui-danger-text)]">{addError}</p>}

            <button
              type="button"
              onClick={addRecipient}
              disabled={saving || !canManage}
              className="inline-flex self-start rounded-[var(--ui-radius-control)] bg-[var(--ui-accent)] px-3.5 py-2 text-sm font-semibold text-[var(--ui-text-inverse)] transition-colors hover:bg-[var(--ui-accent-hover)] disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus aria-hidden="true" size={13} strokeWidth={2} />
                Lägg till
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-5 py-3">
          <p className="text-xs leading-relaxed text-[var(--ui-text-muted)]">
            Dessa adresser får e-post vid markerade händelser utöver offertens ansvariga användare som alltid notifieras.
          </p>
          {!canManage && (
            <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
              Du kan se organisationens kopplingar här, men bara staff kan ändra dem.
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 rounded-[var(--ui-radius-control)] bg-[var(--ui-success-text)] px-4 py-2.5 text-sm font-medium text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-raised)]"
          >
            <CheckCircle aria-hidden="true" size={15} strokeWidth={2} />
            Sparat
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
