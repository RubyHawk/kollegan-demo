'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Plus, Trash, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import type { NotificationTag, NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';

const TAG_DEFS: Record<NotificationTag, { label: string; color: string }> = {
  offer_signed:   { label: 'Offert signerad', color: 'emerald' },
  offer_declined: { label: 'Offert avvisad',  color: 'red'     },
};

const ALL_TAGS = Object.keys(TAG_DEFS) as NotificationTag[];

const TAG_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  red:     'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
};

const TAG_ACTIVE: Record<string, string> = {
  emerald: 'bg-emerald-500 text-white border-emerald-500',
  red:     'bg-red-500 text-white border-red-500',
};

export default function NotifieringarPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags]   = useState<NotificationTag[]>([]);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetch('/api/org/notification-recipients')
      .then((r) => {
        if (!r.ok) throw new Error('api_error');
        return r.json();
      })
      .then((d) => setRecipients(d.recipients ?? []))
      .catch(() => setError('Kunde inte hämta notifieringsinställningar. Försök ladda om sidan.'))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: NotificationRecipient[]) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/org/notification-recipients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: next }),
      });
      if (!res.ok) throw new Error();
      setRecipients(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Kunde inte spara. Försök igen.');
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
    if (recipients.some((r) => r.email === email)) {
      setAddError('Adressen finns redan i listan.');
      return;
    }
    const next = [...recipients, { id: crypto.randomUUID(), email, tags: newTags }];
    setNewEmail('');
    setNewTags([]);
    void persist(next);
  }

  function remove(id: string) {
    void persist(recipients.filter((r) => r.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Laddar…</p>;
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          <WarningCircle size={15} weight="fill" className="shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Recipients list + add form */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border-light)]">
          <Bell size={14} weight="duotone" className="text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Extra mottagare</p>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {recipients.length === 0 ? 'Inga tillagda' : `${recipients.length} st`}
          </span>
        </div>

        {/* List */}
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
                    {(r.tags as NotificationTag[]).map((tag) => (
                      <span
                        key={tag}
                        className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', TAG_COLORS[TAG_DEFS[tag].color])}
                      >
                        {TAG_DEFS[tag].label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={saving}
                    className="shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    aria-label="Ta bort"
                  >
                    <Trash size={13} weight="bold" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add form */}
        <div className={cn('px-5 py-4', recipients.length > 0 && 'border-t border-[var(--border-light)]')}>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Lägg till mottagare</p>

          <div className="flex flex-col gap-2.5">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="namn@foretag.se"
              className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:border-[var(--accent)]"
            />

            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => {
                const def = TAG_DEFS[tag];
                const active = newTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      active ? TAG_ACTIVE[def.color] : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                    )}
                  >
                    {def.label}
                  </button>
                );
              })}
            </div>

            {addError && (
              <p className="text-xs text-red-500">{addError}</p>
            )}

            <button
              onClick={addRecipient}
              disabled={saving}
              className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50"
            >
              <Plus size={13} weight="bold" />
              Lägg till
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 py-3 border-t border-[var(--border-light)] bg-[var(--surface-alt)]">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Dessa adresser får e-post vid markerade händelser — utöver offertens skapare som alltid notifieras.
          </p>
        </div>
      </div>

      {/* Saved toast */}
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
