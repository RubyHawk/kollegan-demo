'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SectionCard, Input, Icon } from '../_components/shared';
import type { NotificationTag, NotificationRecipient } from '@modules/supporting/identity/domain/organization.entity';

// ─── Tag definitions ────────────────────────────────────────────────────────────
// Add new entries here as more features get email notifications.

const TAG_DEFS: Record<NotificationTag, { label: string; desc: string; color: string }> = {
  offer_signed:  { label: 'Offert signerad',  desc: 'Kund har accepterat & signerat',  color: 'emerald' },
  offer_declined: { label: 'Offert avvisad', desc: 'Kund har tackat nej',              color: 'red'     },
};

const ALL_TAGS = Object.keys(TAG_DEFS) as NotificationTag[];

const TAG_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  red:     'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function TagBadge({ tag, onRemove }: { tag: NotificationTag; onRemove?: () => void }) {
  const def = TAG_DEFS[tag];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', TAG_COLORS[def.color])}>
      {def.label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity" aria-label={`Ta bort ${def.label}`}>
          <Icon path={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} size={10} />
        </button>
      )}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function NotifieringarPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Add-form state
  const [newEmail, setNewEmail]     = useState('');
  const [newTags, setNewTags]       = useState<NotificationTag[]>([]);
  const [addError, setAddError]     = useState('');

  useEffect(() => {
    fetch('/api/org/notification-recipients')
      .then((r) => r.json())
      .then((d) => setRecipients(d.recipients ?? []))
      .catch(() => {})
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
      if (!res.ok) throw new Error('save failed');
      setRecipients(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // keep current state on failure
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
      setAddError('Välj minst en notifieringstyp.');
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      setAddError('Den e-postadressen finns redan i listan.');
      return;
    }
    const next: NotificationRecipient[] = [
      ...recipients,
      { id: crypto.randomUUID(), email, tags: newTags },
    ];
    setNewEmail('');
    setNewTags([]);
    persist(next);
  }

  function removeRecipient(id: string) {
    persist(recipients.filter((r) => r.id !== id));
  }

  function removeTag(recipientId: string, tag: NotificationTag) {
    const next = recipients.map((r) => {
      if (r.id !== recipientId) return r;
      return { ...r, tags: r.tags.filter((t) => t !== tag) };
    }).filter((r) => r.tags.length > 0); // remove if no tags left
    persist(next);
  }

  function toggleNewTag(tag: NotificationTag) {
    setNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Current recipients */}
      <SectionCard
        title="Notifieringsmottagare"
        description="Dessa adresser får e-post när markerade händelser inträffar, utöver den som skapade offerten."
      >
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Laddar…</p>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">Inga extra mottagare tillagda ännu.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border-light)]">
            <AnimatePresence initial={false}>
              {recipients.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 overflow-hidden"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{r.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(r.tags as NotificationTag[]).map((tag) => (
                        <TagBadge key={tag} tag={tag} onRemove={() => removeTag(r.id, tag)} />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeRecipient(r.id)}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    aria-label="Ta bort mottagare"
                  >
                    <Icon path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>} size={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SectionCard>

      {/* Add new recipient */}
      <SectionCard title="Lägg till mottagare">
        <div className="flex flex-col gap-4">

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">
              E-postadress
            </label>
            <Input
              value={newEmail}
              onChange={setNewEmail}
              placeholder="namn@foretag.se"
              type="email"
            />
          </div>

          {/* Tag selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Notifieringstyper
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const def = TAG_DEFS[tag];
                const active = newTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleNewTag(tag)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all duration-150',
                      active
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)] font-semibold'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:bg-[var(--surface-alt)]',
                    )}
                  >
                    <span className={cn(
                      'w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0',
                      active
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'border-[var(--border)]',
                    )}>
                      {active && <Icon path={<polyline points="20 6 9 17 4 12"/>} size={10} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium leading-tight">{def.label}</span>
                      <span className="block text-[11px] text-[var(--text-muted)] leading-tight">{def.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {addError && (
            <p className="text-xs text-red-500">{addError}</p>
          )}

          <div>
            <button
              onClick={addRecipient}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150',
                'bg-[var(--accent)] border-[var(--accent)] text-white',
                'hover:bg-[var(--accent-light)] hover:border-[var(--accent-light)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                saving && 'opacity-60 cursor-wait',
              )}
            >
              <Icon path={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} size={14} />
              {saving ? 'Sparar…' : 'Lägg till mottagare'}
            </button>
          </div>

        </div>
      </SectionCard>

      {/* Status toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-lg"
          >
            <Icon path={<polyline points="20 6 9 17 4 12"/>} size={14} />
            Sparat!
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
