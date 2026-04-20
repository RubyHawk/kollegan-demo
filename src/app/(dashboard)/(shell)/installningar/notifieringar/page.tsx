'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle, Plus, Trash, WarningCircle } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import {
  getNotificationRecipients,
  updateNotificationRecipients,
  type NotificationRecipient,
} from '@shared/lib/api/settings.api';
import {
  ACTIVE_NOTIFICATION_DEFINITIONS,
  ACTIVE_NOTIFICATION_TAGS,
  type ActiveNotificationTag,
} from '@modules/supporting/identity/domain/notification-routing';

const TONE_PILL: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400',
  red: 'border-red-200 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400',
};

const TONE_ACTIVE: Record<string, string> = {
  emerald: 'border-emerald-500 bg-emerald-500 text-white',
  red: 'border-red-500 bg-red-500 text-white',
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
    return <p className="text-sm text-[var(--text-muted)]">Laddar notifieringskopplingar...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
            <Bell size={18} weight="duotone" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Interna notifieringsmottagare</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
              Lägg till valfria e-postadresser som ska få interna notiser när en offert accepteras eller avvisas.
              Adressen behöver inte vara kopplad till ett konto i systemet.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          <WarningCircle size={15} weight="fill" className="shrink-0" />
          {error}
          <button type="button" onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">
            x
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-0)]">
        <div className="flex items-center gap-2 border-b border-[var(--border-light)] px-5 py-3.5">
          <Bell size={14} weight="duotone" className="text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Aktiva kopplingar</p>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {recipients.length === 0 ? 'Inga tillagda' : `${recipients.length} kopplingar`}
          </span>
        </div>

        {recipients.length > 0 ? (
          <div className="divide-y divide-[var(--border-light)]">
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
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{recipient.email}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
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
                      className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-900/20"
                      aria-label="Ta bort koppling"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="px-5 py-5 text-sm text-[var(--text-muted)]">
            Inga extra mottagare är tillagda ännu. Offertens ansvariga användare notifieras alltid separat.
          </div>
        )}

        <div className={cn('px-5 py-4', recipients.length > 0 && 'border-t border-[var(--border-light)]')}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Lägg till mottagare</p>

          <div className="flex flex-col gap-2.5">
            <input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addRecipient()}
              placeholder="namn@foretag.se"
              disabled={!canManage}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
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
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                      !canManage && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {definition.label}
                  </button>
                );
              })}
            </div>

            {addError && <p className="text-xs text-red-500">{addError}</p>}

            <button
              type="button"
              onClick={addRecipient}
              disabled={saving || !canManage}
              className="inline-flex self-start rounded-xl bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-light)] disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus size={13} weight="bold" />
                Lägg till
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border-light)] bg-[var(--surface-alt)] px-5 py-3">
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Dessa adresser får e-post vid markerade händelser utöver offertens ansvariga användare som alltid notifieras.
          </p>
          {!canManage && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
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
            className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            <CheckCircle size={15} weight="fill" />
            Sparat
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
