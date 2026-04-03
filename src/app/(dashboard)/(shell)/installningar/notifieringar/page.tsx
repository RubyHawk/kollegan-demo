'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Plus, Trash, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import type { NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';
import {
  ACTIVE_NOTIFICATION_DEFINITIONS,
  ACTIVE_NOTIFICATION_TAGS,
  type ActiveNotificationTag,
} from '@modules/supporting/identity/domain/notification-routing';

const TONE_PILL: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
};

const TONE_ACTIVE: Record<string, string> = {
  emerald: 'bg-emerald-500 text-white border-emerald-500',
  red: 'bg-red-500 text-white border-red-500',
};

export default function NotifieringarPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags] = useState<ActiveNotificationTag[]>([]);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetch('/api/org/notification-recipients')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setRecipients(d.recipients ?? []))
      .catch(() => setError('Kunde inte hamta notifieringsinstallningarna. Forsok ladda om sidan.'))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: NotificationRecipient[]) {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await fetch('/api/org/notification-recipients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: next }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { detail?: string };
        throw new Error(data.detail || 'Kunde inte spara. Forsok igen.');
      }

      const data = await response.json() as { recipients?: NotificationRecipient[] };
      setRecipients(data.recipients ?? next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Kunde inte spara. Forsok igen.';
      setError(message);
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
      setAddError('Valj minst en handelsetyp.');
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      setAddError('Adressen finns redan i listan.');
      return;
    }
    void persist([...recipients, { id: crypto.randomUUID(), email, tags: newTags }]);
    setNewEmail('');
    setNewTags([]);
  }

  function remove(id: string) {
    void persist(recipients.filter((r) => r.id !== id));
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Laddar...</p>;

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
              Lag till valfria e-postadresser som ska fa interna notiser nar en offert accepteras eller avvisas.
              Adressen behover inte vara kopplad till ett konto i systemet.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          <WarningCircle size={15} weight="fill" className="shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100" type="button">x</button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border-light)]">
          <Bell size={14} weight="duotone" className="text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Extra mottagare</p>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {recipients.length === 0 ? 'Inga tillagda' : `${recipients.length} st`}
          </span>
        </div>

        {recipients.length > 0 && (
          <div className="divide-y divide-[var(--border-light)]">
            <AnimatePresence initial={false}>
              {recipients.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.14 }}
                  className="flex items-center gap-3 px-5 py-2.5 overflow-hidden"
                >
                  <p className="flex-1 min-w-0 truncate text-sm text-[var(--text-primary)]">{r.email}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(r.tags as ActiveNotificationTag[]).map((tag) => {
                      const def = ACTIVE_NOTIFICATION_DEFINITIONS.find((d) => d.tag === tag);
                      if (!def) return null;
                      return (
                        <span key={tag} className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', TONE_PILL[def.tone])}>
                          {def.label}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={saving}
                    className="shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    aria-label="Ta bort"
                    type="button"
                  >
                    <Trash size={13} weight="bold" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className={cn('px-5 py-4', recipients.length > 0 && 'border-t border-[var(--border-light)]')}>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Lagg till mottagare</p>
          <div className="flex flex-col gap-2.5">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="namn@foretag.se"
              className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Den här adressen får organisationens interna notifieringar utöver ansvarig användare. Inget konto krävs.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVE_NOTIFICATION_TAGS.map((tag) => {
                const def = ACTIVE_NOTIFICATION_DEFINITIONS.find((d) => d.tag === tag);
                if (!def) return null;
                const active = newTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      active ? TONE_ACTIVE[def.tone] : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                    )}
                  >
                    {def.label}
                  </button>
                );
              })}
            </div>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
            <button
              onClick={addRecipient}
              disabled={saving}
              className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50"
              type="button"
            >
              <Plus size={13} weight="bold" />
              Lagg till
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-light)] bg-[var(--surface-alt)]">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Dessa adresser far e-post vid markerade handelser utover offertens skapare som alltid notifieras.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-lg"
          >
            <CheckCircle size={15} weight="fill" />
            Sparat
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
