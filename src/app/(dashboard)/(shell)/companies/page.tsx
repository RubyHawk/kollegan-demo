'use client';

/**
 * /companies — Company directory
 *
 * Lists all companies linked to this organisation.
 * Supports search, inline create/edit/delete.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@shared/lib/utils';
import type { Company } from '@modules/supporting/offers';
import { fetchWithRefresh } from '@shared/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  CompanyMembersDialog,
  type AssignableUserRecord,
  type CompanyMemberRecord,
  type NewCompanyAccountForm,
} from './_components/company-members-dialog';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CompanyForm {
  name:      string;
  orgNumber: string;
  website:   string;
  logoUrl:   string;
  senderEmail: string;
  senderName: string;
  industry:  string;
  notes:     string;
}

const EMPTY_FORM: CompanyForm = {
  name: '', orgNumber: '', website: '', logoUrl: '', senderEmail: '', senderName: '', industry: '', notes: '',
};

function formFromCompany(company: Company | null): CompanyForm {
  if (!company) return EMPTY_FORM;

  return {
    name:      company.name,
    orgNumber: company.orgNumber ?? '',
    website:   company.website ?? '',
    logoUrl:   company.logoUrl ?? '',
    senderEmail: company.senderEmail ?? '',
    senderName: company.senderName ?? '',
    industry:  company.industry ?? '',
    notes:     company.notes ?? '',
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Company Row ───────────────────────────────────────────────────────────────

function CompanyRow({
  company,
  onEdit,
  onDelete,
  onMembers,
}: {
  company:  Company;
  onEdit:   (c: Company) => void;
  onDelete: (c: Company) => void;
  onMembers: (c: Company) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-alt)] transition-colors">
      {/* Avatar */}
      {company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.logoUrl}
          alt={company.name}
          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border)]"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg shrink-0 bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
          {initials(company.name)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{company.name}</span>
          {company.orgNumber && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded font-mono shrink-0">
              {company.orgNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {company.industry && (
            <span className="text-xs text-[var(--text-muted)] truncate">{company.industry}</span>
          )}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--accent)] hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {company.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={() => onMembers(company)}
          className="p-1.5 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Hantera användare"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>
        <button
          onClick={() => onEdit(company)}
          className="p-1.5 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Redigera"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onDelete(company)}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-600 transition-colors"
          title="Ta bort"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Company Modal ──────────────────────────────────────────────────────────────

function CompanyModal({
  open,
  company,
  onClose,
  onSave,
  saving,
}: {
  open:    boolean;
  company: Company | null;
  onClose: () => void;
  onSave:  (form: CompanyForm) => void;
  saving:  boolean;
}) {
  const [form, setForm] = useState<CompanyForm>(() => formFromCompany(company));

  if (!open) return null;

  const set = (k: keyof CompanyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors';
  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[var(--surface-0)] sm:rounded-2xl shadow-xl border border-[var(--border)] overflow-y-auto max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {company ? 'Redigera företag' : 'Nytt företag'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Namn *</label>
            <input value={form.name} onChange={set('name')} placeholder="Acme AB" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Organisationsnummer</label>
              <input value={form.orgNumber} onChange={set('orgNumber')} placeholder="556677-8899" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bransch</label>
              <input value={form.industry} onChange={set('industry')} placeholder="Teknik, Finans…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Webbplats</label>
            <input type="url" value={form.website} onChange={set('website')} placeholder="https://example.com" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Logo-URL</label>
            <input type="url" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…/logo.png" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Avsändarnamn</label>
              <input value={form.senderName} onChange={set('senderName')} placeholder="Soleria" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Avsändarmejl</label>
              <input type="email" value={form.senderEmail} onChange={set('senderEmail')} placeholder="no-reply@…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Anteckningar</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Interna anteckningar om företaget…"
              className={cn(inputCls, 'resize-none')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors">
            Avbryt
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Sparar…' : company ? 'Spara ändringar' : 'Skapa företag'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [companies,   setCompanies]   = useState<Company[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [membersCompany, setMembersCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMemberRecord[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AssignableUserRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [saving,      setSaving]      = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetchWithRefresh(`/api/companies?${params}`);
      if (!res.ok) throw new Error('Kunde inte hämta företag');
      const json = await res.json() as { data: { companies: Company[] } };
      setCompanies(json.data.companies);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const openCreate = () => { setEditCompany(null); setModalOpen(true); };
  const openEdit   = (c: Company) => { setEditCompany(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditCompany(null); };

  const handleSave = useCallback(async (form: CompanyForm) => {
    setSaving(true);
    try {
      const body = {
        name:      form.name.trim(),
        orgNumber: form.orgNumber.trim()  || undefined,
        website:   form.website.trim()    || undefined,
        logoUrl:   form.logoUrl.trim()    || undefined,
        senderEmail: form.senderEmail.trim() || undefined,
        senderName: form.senderName.trim() || undefined,
        industry:  form.industry.trim()   || undefined,
        notes:     form.notes.trim()      || undefined,
      };

      const res = editCompany
        ? await fetchWithRefresh(`/api/companies/${editCompany.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
        : await fetchWithRefresh('/api/companies', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });

      if (!res.ok) throw new Error('Kunde inte spara företaget');
      closeModal();
      void load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editCompany, load]);

  const loadMembers = useCallback(async (company: Company) => {
    setMembersCompany(company);
    setMembersLoading(true);
    setError(null);
    try {
      const res = await fetchWithRefresh(`/api/companies/${company.id}/members`);
      if (!res.ok) throw new Error('Kunde inte hämta användarkopplingar');
      const json = await res.json() as {
        data: {
          members: CompanyMemberRecord[];
          availableUsers: AssignableUserRecord[];
        };
      };
      setMembers(json.data.members);
      setAvailableUsers(json.data.availableUsers);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleAddMember = useCallback(async (userId: string, role: 'staff' | 'admin') => {
    if (!membersCompany) return;
    setMemberSaving(true);
    try {
      const res = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error('Kunde inte koppla användaren till företaget');
      await loadMembers(membersCompany);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMemberSaving(false);
    }
  }, [loadMembers, membersCompany]);

  const handleCreateMemberAccount = useCallback(async (form: NewCompanyAccountForm) => {
    if (!membersCompany) return;
    setMemberSaving(true);
    try {
      const res = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'create',
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          role: form.role,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Kunde inte skapa kontot');
      }
      await loadMembers(membersCompany);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMemberSaving(false);
    }
  }, [loadMembers, membersCompany]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    if (!membersCompany) return;
    setMemberSaving(true);
    try {
      const res = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Kunde inte ta bort användarkopplingen');
      await loadMembers(membersCompany);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMemberSaving(false);
    }
  }, [loadMembers, membersCompany]);

  const handleDelete = useCallback(async (c: Company) => {
    const res = await fetchWithRefresh(`/api/companies/${c.id}`, { method: 'DELETE' });
    if (!res.ok) { setError('Kunde inte ta bort företaget'); return; }
    setDeleteCompany(null);
    void load();
  }, [load]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-0)] px-6 py-4">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Företag</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {companies.length} {companies.length === 1 ? 'företag' : 'företag'} totalt
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nytt företag
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-0)] px-6 py-2.5">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchInput}
              onChange={(e) => {
                const v = e.target.value;
                setSearchInput(v);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => setSearch(v), 300);
              }}
              placeholder="Sök företag…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-48"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--surface-alt)] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && companies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-3)] flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Inga företag hittades</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Skapa ditt första företag för att börja</p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors"
            >
              + Nytt företag
            </button>
          </div>
        )}

        {!loading && companies.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] divide-y divide-[var(--border)] overflow-hidden">
            {companies.map((c) => (
                <CompanyRow
                  key={c.id}
                  company={c}
                  onEdit={openEdit}
                  onDelete={setDeleteCompany}
                  onMembers={(company) => { void loadMembers(company); }}
                />
              ))}
            </div>
        )}
      </div>

      {modalOpen && (
        <CompanyModal
          key={editCompany?.id ?? 'new-company'}
          open={modalOpen}
          company={editCompany}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {membersCompany && (
        <CompanyMembersDialog
          open={Boolean(membersCompany)}
          companyName={membersCompany.name}
          members={members}
          availableUsers={availableUsers}
          loading={membersLoading}
          saving={memberSaving}
          onOpenChange={(open) => { if (!open) setMembersCompany(null); }}
          onAddMember={handleAddMember}
          onCreateMemberAccount={handleCreateMemberAccount}
          onRemoveMember={handleRemoveMember}
        />
      )}

      <Dialog open={Boolean(deleteCompany)} onOpenChange={(open) => { if (!open) setDeleteCompany(null); }}>
        <DialogContent mobileVariant="sheet" showMobileClose className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ta bort företag?</DialogTitle>
            <DialogDescription>
              Företaget tas bort från registret och kan inte återställas automatiskt.
            </DialogDescription>
          </DialogHeader>

          {deleteCompany && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">{deleteCompany.name}</p>
              {deleteCompany.orgNumber && <p className="mt-1">Org.nr: {deleteCompany.orgNumber}</p>}
            </div>
          )}

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setDeleteCompany(null)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => { if (deleteCompany) void handleDelete(deleteCompany); }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Ta bort
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
