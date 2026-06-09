'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Copy, LoaderCircle, Plus, Search, Users, X } from 'lucide-react';
import { replaceBrowserQuery } from '@shared/lib/browser-query';
import { cn } from '@shared/lib/utils';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CustomerContact,
} from '@shared/lib/api/customers.api';
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Pagination } from '@shared/ui/pagination';
import { Panel } from '@shared/ui/panel';
import { Skeleton } from '@shared/ui/skeleton';
import { StatusBadge } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';
import ToastContainer from '@shared/ui/toast/toast-container';
import { useToast } from '@shared/ui/toast/toast-context';

type Contact = CustomerContact;

const EMPTY_FORM = { name: '', phone: '', email: '', company: '', notes: '' };
const PAGE_SIZE = 50;

function parsePageParam(page: string | null) {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ContactsPageInner() {
  const searchParams = useSearchParams();
  const { toasts, addToast, dismissToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [currentPage, setCurrentPage] = useState(() => parsePageParam(searchParams.get('page')));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [acting, setActing] = useState<string | null>(null);
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
    } catch {
      setError('Kunde inte ladda kontakter. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    replaceBrowserQuery({
      search: search.trim() || null,
      page: currentPage > 0 ? currentPage + 1 : null,
    });
  }, [currentPage, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setForm({
      name: contact.name ?? '',
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      company: contact.company ?? '',
      notes: contact.notes ?? '',
    });
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const saveContact = useCallback(async () => {
    if (!form.name.trim()) {
      setError('Namn krävs.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        notes: form.notes.trim() || null,
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
    } catch {
      setError('Kunde inte spara kontakt. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, editing, load]);

  const deleteContact = useCallback(async (id: string) => {
    setActing(id);
    try {
      await deleteCustomer(id);
      await load(true);
    } catch {
      setError('Kunde inte ta bort kontakt. Kontrollera anslutningen och försök igen.');
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
      icon: <Check aria-hidden="true" size={14} strokeWidth={1.75} />,
    });
    window.setTimeout(() => setCopiedContactValue(null), 1800);
  }, [addToast]);

  const copyCurrentViewLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedContactValue('view');
    addToast({
      message: 'Vy-länk kopierad',
      color: 'emerald',
      icon: <Check aria-hidden="true" size={14} strokeWidth={1.75} />,
    });
    window.setTimeout(() => setCopiedContactValue(null), 1800);
  }, [addToast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Tillbaka till CRM">
              <Link href="/crm">
                <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Kontakter</h1>
            <StatusBadge tone="neutral">{total}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Individer kopplade till kunder och leads.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Ny kontakt
        </Button>
      </div>

      {error ? (
        <InlineAlert tone="danger">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="compact" onClick={() => void load()}>
                Försök igen
              </Button>
              <button type="button" onClick={() => setError(null)} className="opacity-70 hover:opacity-100" aria-label="Stäng felmeddelande">
                <X aria-hidden="true" size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </InlineAlert>
      ) : null}

      {showForm ? (
        <ContactForm
          editing={editing}
          form={form}
          saving={saving}
          onClose={closeForm}
          onSave={() => void saveContact()}
          onChange={(next) => setForm((current) => ({ ...current, ...next }))}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search aria-hidden="true" size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
          <Input
            type="search"
            placeholder="Sök kontakt..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(0);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {search ? (
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={() => {
                setSearch('');
                setCurrentPage(0);
              }}
            >
              Rensa
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="compact" onClick={() => void copyCurrentViewLink()}>
            {copiedContactValue === 'view' ? <Check aria-hidden="true" size={16} strokeWidth={1.75} /> : <Copy aria-hidden="true" size={16} strokeWidth={1.75} />}
            Kopiera vy
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} className="animate-spin text-[var(--ui-text-muted)]" />
          <p className="text-sm text-[var(--ui-text-muted)]">Laddar kontakter...</p>
        </div>
      ) : (
        <Panel padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--ui-border-subtle)] text-sm">
              <thead className="bg-[var(--ui-surface-subtle)]">
                <tr>
                  {['Namn', 'Titel / Företag', 'E-post', 'Telefon', 'Samtal', 'Senast sedd', ''].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border-subtle)] bg-[var(--ui-surface)]">
                {contacts.map((contact) => (
                  <tr key={contact.id} className={cn('transition-colors hover:bg-[var(--ui-surface-hover)]', acting === contact.id && 'opacity-50')}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={contact.name} />
                        <span className="font-medium text-[var(--ui-text)]">{contact.name ?? '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--ui-text-secondary)]">{contact.company ?? <span className="text-[var(--ui-text-muted)]">-</span>}</td>
                    <td className="px-4 py-3.5 text-xs text-[var(--ui-text-muted)]">
                      {contact.email ? (
                        <div className="flex items-center gap-2">
                          <CopyableContactValue
                            value={contact.email}
                            label="e-post"
                            copied={copiedContactValue === `email:${contact.id}`}
                            onCopy={() => void copyContactValue(`email:${contact.id}`, contact.email ?? '', 'E-post')}
                          />
                          <Button asChild variant="link" size="compact" className="h-auto px-0 text-[11px]">
                            <a href={`mailto:${contact.email}`}>Maila</a>
                          </Button>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--ui-text-muted)]">
                      {contact.phone ? (
                        <div className="flex items-center gap-2">
                          <CopyableContactValue
                            value={contact.phone}
                            label="telefon"
                            copied={copiedContactValue === `phone:${contact.id}`}
                            onCopy={() => void copyContactValue(`phone:${contact.id}`, contact.phone ?? '', 'Telefon')}
                          />
                          <Button asChild variant="link" size="compact" className="h-auto px-0 text-[11px]">
                            <a href={`tel:${contact.phone}`}>Ring</a>
                          </Button>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      {contact.callCount > 0 ? <StatusBadge tone="accent">{contact.callCount}</StatusBadge> : <span className="text-[var(--ui-text-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[var(--ui-text-muted)]">{fmtDate(contact.lastSeen)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="compact" onClick={() => openEdit(contact)}>
                          Redigera
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="compact"
                          onClick={() => setConfirmDeleteContact(contact)}
                          disabled={acting === contact.id}
                        >
                          Ta bort
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <EmptyState icon={Users} title="Inga kontakter ännu" description="Klicka på Ny kontakt för att lägga till." />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {total > 0 ? (
            <div className="border-t border-[var(--ui-border)]">
              <div className="px-3 pt-2 text-center text-xs text-[var(--ui-text-muted)] sm:text-left">
                Visar {currentPage * PAGE_SIZE + 1}-{currentPage * PAGE_SIZE + contacts.length} av {total} kontakter
              </div>
              <Pagination
                page={currentPage + 1}
                pageCount={totalPages}
                onPrevious={canGoBack ? () => setCurrentPage((page) => Math.max(0, page - 1)) : undefined}
                onNext={canGoForward ? () => setCurrentPage((page) => page + 1) : undefined}
                label="Kontaktpaginering"
              />
            </div>
          ) : null}
        </Panel>
      )}

      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteContact)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteContact(null);
        }}
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

function ContactsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Panel padding="none" className="overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-44 max-w-full" />
              <Skeleton className="h-2.5 w-28 max-w-full" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </Panel>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsPageInner />
    </Suspense>
  );
}

function ContactForm({
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  editing: Contact | null;
  form: typeof EMPTY_FORM;
  saving: boolean;
  onChange: (next: Partial<typeof EMPTY_FORM>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-6 py-4">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">{editing ? 'Redigera kontakt' : 'Ny kontakt'}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Stäng formulär">
          <X aria-hidden="true" size={16} strokeWidth={1.75} />
        </Button>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Namn *" className="sm:col-span-2">
          <Input value={form.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Anna Lindström" />
        </Field>
        <Field label="E-post">
          <Input type="email" value={form.email} onChange={(event) => onChange({ email: event.target.value })} placeholder="anna@example.com" />
        </Field>
        <Field label="Telefon">
          <Input type="tel" value={form.phone} onChange={(event) => onChange({ phone: event.target.value })} placeholder="070-111 22 33" />
        </Field>
        <Field label="Företag">
          <Input value={form.company} onChange={(event) => onChange({ company: event.target.value })} placeholder="Lindström AB" />
        </Field>
        <Field label="Anteckningar">
          <Textarea value={form.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Valfri notering..." className="min-h-10" />
        </Field>
        <div className="flex flex-wrap gap-2 border-t border-[var(--ui-border-subtle)] pt-4 sm:col-span-2">
          <Button type="button" onClick={onSave} disabled={saving} loading={saving}>
            {saving ? 'Sparar...' : editing ? 'Spara ändringar' : 'Skapa kontakt'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-[var(--ui-text-secondary)]">{label}</label>
      {children}
    </div>
  );
}

function Avatar({ name }: { name: string | null }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[10px] font-bold text-[var(--ui-text-secondary)]">
      {initials(name)}
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
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] text-[var(--ui-text-muted)] opacity-0 transition hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-accent)] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] group-hover:opacity-100"
      >
        {copied ? <Check aria-hidden="true" size={13} strokeWidth={1.75} /> : <Copy aria-hidden="true" size={13} strokeWidth={1.75} />}
      </button>
    </span>
  );
}
