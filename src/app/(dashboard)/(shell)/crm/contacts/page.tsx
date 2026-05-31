'use client';

/**
 * /crm/contacts
 *
 * Contact book — individual contacts (Customer records) with full CRUD.
 * Connected through the customers feature API client.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from '@phosphor-icons/react';
import { replaceBrowserQuery } from '@shared/lib/browser-query';
import { cn } from '@shared/lib/utils';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import ToastContainer from '@shared/ui/toast/toast-container';
import { useToast } from '@shared/ui/toast/toast-context';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CustomerContact,
} from '@shared/lib/api/customers.api';

// ─── Types ───────────────────────────────────────────────────────────────────

type Contact = CustomerContact;

const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500'];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = { name: '', phone: '', email: '', company: '', notes: '' };
const PAGE_SIZE = 50;

function parsePageParam(page: string | null) {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const { toasts, addToast, dismissToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState(searchParams.get('search') ?? '');
  const [currentPage, setCurrentPage] = useState(() => parsePageParam(searchParams.get('page')));
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [editing,  setEditing]  = useState<Contact | null>(null);
  const [acting,   setActing]   = useState<string | null>(null);
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<Contact | null>(null);
  const [copiedContactValue, setCopiedContactValue] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await listCustomers({
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        search: search.trim() || undefined,
      });
      setContacts(result.contacts);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    replaceBrowserQuery({
      search: search.trim() || null,
      page: currentPage > 0 ? currentPage + 1 : null,
    });
  }, [currentPage, search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setError(null); };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name ?? '', phone: c.phone ?? '', email: c.email ?? '', company: c.company ?? '', notes: c.notes ?? '' });
    setShowForm(true);
    setError(null);
  };

  const saveContact = useCallback(async () => {
    if (!form.name.trim()) { setError('Namn krävs.'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name:    form.name.trim(),
        phone:   form.phone.trim()   || null,
        email:   form.email.trim()   || null,
        company: form.company.trim() || null,
        notes:   form.notes.trim()   || null,
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
      } else {
        await createCustomer(payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, editing, load]);

  const deleteContact = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteCustomer(id);
      await load(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActing(null);
      setConfirmDeleteContact(null);
    }
  }, [load]);

  const copyContactValue = useCallback(async (key: string, value: string, label: string) => {
    if (!value) return;

    await navigator.clipboard.writeText(value).catch(() => {});
    setCopiedContactValue(key);
    addToast({
      message: `${label} kopierad`,
      color: 'emerald',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    });
    window.setTimeout(() => setCopiedContactValue(null), 1800);
  }, [addToast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/crm" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
            </a>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Kontakter</h1>
            <span className="ml-2 inline-flex items-center rounded-full bg-[var(--surface-alt)] border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {total}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Individer kopplade till kunder och leads.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny kontakt
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{editing ? 'Redigera kontakt' : 'Ny kontakt'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="p-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Namn *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Anna Lindström"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">E-post</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="anna@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="070-111 22 33"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Företag</label>
              <input
                value={form.company}
                onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Lindström AB"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Anteckningar</label>
              <input
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Valfri notering…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => void saveContact()}
                disabled={saving}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Sparar…' : editing ? 'Spara ändringar' : 'Skapa kontakt'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); setError(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Sök kontakt…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCurrentPage(0);
            }}
            className="w-fit rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            Rensa
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar kontakter…</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  {['Namn', 'Titel / Företag', 'E-post', 'Telefon', 'Samtal', 'Senast sedd', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {contacts.map((c) => (
                  <tr key={c.id} className={cn('hover:bg-[var(--surface-hover)] transition-colors', acting === c.id && 'opacity-50')}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${avatarColor(c.id)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {initials(c.name)}
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{c.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{c.company ?? <span className="text-[var(--text-muted)]">—</span>}</td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">
                      {c.email ? (
                        <CopyableContactValue
                          value={c.email}
                          label="e-post"
                          copied={copiedContactValue === `email:${c.id}`}
                          onCopy={() => void copyContactValue(`email:${c.id}`, c.email ?? '', 'E-post')}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">
                      {c.phone ? (
                        <CopyableContactValue
                          value={c.phone}
                          label="telefon"
                          copied={copiedContactValue === `phone:${c.id}`}
                          onCopy={() => void copyContactValue(`phone:${c.id}`, c.phone ?? '', 'Telefon')}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.callCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
                          {c.callCount}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">{fmtDate(c.lastSeen)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Redigera
                        </button>
                        <span className="text-[var(--border)]">·</span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteContact(c)}
                          disabled={acting === c.id}
                          className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Inga kontakter ännu</p>
                        <p className="text-xs text-[var(--text-muted)]">Klicka på &ldquo;Ny kontakt&rdquo; för att lägga till.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span className="text-center sm:text-left">
                Visar {currentPage * PAGE_SIZE + 1}-{currentPage * PAGE_SIZE + contacts.length} av {total} kontakter
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={!canGoBack}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Föregående
                </button>
                <span className="tabular-nums">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={!canGoForward}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Nästa
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteContact)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteContact(null); }}
        title="Ta bort kontakt?"
        description={
          confirmDeleteContact
            ? `${confirmDeleteContact.name ?? 'Kontakten'} tas bort permanent. Det här går inte att ångra.`
            : 'Kontakten tas bort permanent. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort kontakt"
        loading={Boolean(confirmDeleteContact && acting === confirmDeleteContact.id)}
        onConfirm={() => {
          if (!confirmDeleteContact) return;
          void deleteContact(confirmDeleteContact.id);
        }}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function CopyableContactValue({
  value,
  label,
  copied,
  onCopy,
}: {
  value: string;
  label: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <span className="group inline-flex max-w-[190px] items-center gap-1.5">
      <span className="truncate">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        title={`Kopiera ${label}`}
        aria-label={`Kopiera ${label}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--surface-alt)] hover:text-[var(--accent)] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 group-hover:opacity-100"
      >
        {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
      </button>
    </span>
  );
}
