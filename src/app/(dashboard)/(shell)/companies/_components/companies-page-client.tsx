'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowSquareOut, Buildings, FileText, Package, Plus, UsersThree } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import type { Company } from '@modules/supporting/offers';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import { useActiveCompany } from '@shared/hooks/use-active-company';
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
} from './company-members-dialog';
import { CompanyModal, type CompanyForm } from './company-modal';
import { CompanyOverviewDialog } from './company-overview-dialog';
import { CompanyRow } from './company-row';

export function CompaniesPageClient() {
  const router = useRouter();
  const {
    companies: scopedCompanies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    reload: reloadScopedCompanies,
  } = useActiveCompany();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [membersCompany, setMembersCompany] = useState<Company | null>(null);
  const [overviewCompany, setOverviewCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMemberRecord[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AssignableUserRecord[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await fetchWithRefresh(`/api/companies?${params}`);
      if (!response.ok) throw new Error('Kunde inte hämta företag');

      const payload = (await response.json()) as { data: { companies: Company[] } };
      setCompanies(payload.data.companies);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditCompany(null);
    setModalOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditCompany(company);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCompany(null);
  };

  const loadMembers = useCallback(async (company: Company) => {
    setMembersCompany(company);
    setMembersLoading(true);
    setError(null);
    try {
      const response = await fetchWithRefresh(`/api/companies/${company.id}/members`);
      if (!response.ok) throw new Error('Kunde inte hämta användarkopplingar');
      const payload = (await response.json()) as {
        data: {
          members: CompanyMemberRecord[];
          availableUsers: AssignableUserRecord[];
        };
      };
      setMembers(payload.data.members);
      setAvailableUsers(payload.data.availableUsers);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleSave = useCallback(
    async (form: CompanyForm) => {
      setSaving(true);
      try {
        const body = {
          name: form.name.trim(),
          orgNumber: form.orgNumber.trim() || undefined,
          website: form.website.trim() || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
          senderEmail: form.senderEmail.trim() || undefined,
          senderName: form.senderName.trim() || undefined,
          industry: form.industry.trim() || undefined,
          notes: form.notes.trim() || undefined,
        };

        const response = editCompany
          ? await fetchWithRefresh(`/api/companies/${editCompany.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
          : await fetchWithRefresh('/api/companies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });

        if (!response.ok) throw new Error('Kunde inte spara företaget');

        const payload = (await response.json()) as { data: Company };
        const savedCompany = payload.data;

        closeModal();
        await Promise.all([load(), reloadScopedCompanies()]);

        if (!selectedCompanyId || !editCompany) {
          setSelectedCompanyId(savedCompany.id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [editCompany, load, reloadScopedCompanies, selectedCompanyId, setSelectedCompanyId],
  );

  const handleAddMember = useCallback(
    async (userId: string, role: 'staff' | 'admin') => {
      if (!membersCompany) return;
      setMemberSaving(true);
      try {
        const response = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role }),
        });
        if (!response.ok) throw new Error('Kunde inte koppla användaren till företaget');
        await loadMembers(membersCompany);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setMemberSaving(false);
      }
    },
    [loadMembers, membersCompany],
  );

  const handleCreateMemberAccount = useCallback(
    async (form: NewCompanyAccountForm) => {
      if (!membersCompany) return;
      setMemberSaving(true);
      try {
        const response = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members`, {
          method: 'PUT',
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
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || 'Kunde inte skapa kontot');
        }
        await loadMembers(membersCompany);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setMemberSaving(false);
      }
    },
    [loadMembers, membersCompany],
  );

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!membersCompany) return;
      setMemberSaving(true);
      try {
        const response = await fetchWithRefresh(`/api/companies/${membersCompany.id}/members?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Kunde inte ta bort användarkopplingen');
        await loadMembers(membersCompany);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setMemberSaving(false);
      }
    },
    [loadMembers, membersCompany],
  );

  const handleDelete = useCallback(
    async (company: Company) => {
      const response = await fetchWithRefresh(`/api/companies/${company.id}`, { method: 'DELETE' });
      if (!response.ok) {
        setError('Kunde inte ta bort företaget');
        return;
      }

      if (selectedCompanyId === company.id) {
        setSelectedCompanyId('');
      }

      setDeleteCompany(null);
      await Promise.all([load(), reloadScopedCompanies()]);
    },
    [load, reloadScopedCompanies, selectedCompanyId, setSelectedCompanyId],
  );

  const openTemplatesForCompany = useCallback(
    (company: { id: string }) => {
      setSelectedCompanyId(company.id);
      setOverviewCompany(null);
      router.push('/mallar');
    },
    [router, setSelectedCompanyId],
  );

  const openProductsForCompany = useCallback(
    (company: { id: string }) => {
      setSelectedCompanyId(company.id);
      setOverviewCompany(null);
      router.push('/produkter');
    },
    [router, setSelectedCompanyId],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)]">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-[var(--border)] px-6 py-6 xl:border-b-0 xl:border-r">
            <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Företag
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[var(--text-primary)]">
              Samla branding, mallar, produkter och medlemmar per företag.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Varje företag styr sin egen avsändare, sin egen logotyp och vilka mallar och produkter som ska dyka upp i offertflödet.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                <Plus size={16} weight="bold" />
                Nytt företag
              </button>
              {selectedCompany && (
                <>
                  <button
                    type="button"
                    onClick={() => openTemplatesForCompany(selectedCompany)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <FileText size={16} weight="duotone" />
                    Öppna mallar för {selectedCompany.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => openProductsForCompany(selectedCompany)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <Package size={16} weight="duotone" />
                    Öppna produkter
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Buildings size={16} weight="duotone" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Företag</span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{companies.length}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Aktiva företag i ditt offertflöde.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <ArrowSquareOut size={16} weight="duotone" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Valt nu</span>
              </div>
              <p className="mt-3 truncate text-lg font-semibold text-[var(--text-primary)]">
                {selectedCompany?.name ?? 'Inget valt ännu'}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Det här företaget styr vilka mallar och produkter som syns.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <UsersThree size={16} weight="duotone" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Behörighet</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Staff + företagsadmin</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Skapa företag, koppla medlemmar och bygg branding per bolag.</p>
            </div>
          </div>
        </div>
      </section>

      <CompanyScopeSelector
        companies={scopedCompanies}
        selectedCompanyId={selectedCompanyId}
        onSelect={setSelectedCompanyId}
        compact
        title="Välj företag att arbeta i"
        description="Det här valet påverkar offertmallar, produktbibliotek och branding i resten av systemet."
      />

      <section className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Företagsöversikt</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Redigera branding, hantera medlemmar och öppna rätt mallar och produkter för varje företag.
            </p>
          </div>

          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;
                setSearchInput(value);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => setSearch(value), 300);
              }}
              placeholder="Sök företag…"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none md:w-60"
            />
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[26px] bg-[var(--surface-alt)]" />
              ))}
            </div>
          )}

          {!loading && companies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                <Buildings size={24} weight="duotone" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Inga företag hittades</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Skapa ditt första företag för att börja styra branding och scopes.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                + Nytt företag
              </button>
            </div>
          )}

          {!loading && companies.length > 0 && (
            <div className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)]">
              {companies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  active={company.id === selectedCompanyId}
                  onActivate={setSelectedCompanyId}
                  onOverview={setOverviewCompany}
                  onEdit={openEdit}
                  onDelete={setDeleteCompany}
                  onMembers={(nextCompany) => {
                    void loadMembers(nextCompany);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CompanyModal
        key={editCompany?.id ?? (modalOpen ? 'new-company' : 'closed')}
        open={modalOpen}
        company={editCompany}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />

      <CompanyOverviewDialog
        open={Boolean(overviewCompany)}
        company={overviewCompany}
        onOpenChange={(open) => {
          if (!open) setOverviewCompany(null);
        }}
        onEdit={(company) => {
          setOverviewCompany(null);
          openEdit(company);
        }}
        onManageMembers={(company) => {
          setOverviewCompany(null);
          void loadMembers(company);
        }}
        onOpenTemplates={openTemplatesForCompany}
        onOpenProducts={openProductsForCompany}
      />

      {membersCompany && (
        <CompanyMembersDialog
          open={Boolean(membersCompany)}
          companyName={membersCompany.name}
          members={members}
          availableUsers={availableUsers}
          loading={membersLoading}
          saving={memberSaving}
          onOpenChange={(open) => {
            if (!open) setMembersCompany(null);
          }}
          onAddMember={handleAddMember}
          onCreateMemberAccount={handleCreateMemberAccount}
          onRemoveMember={handleRemoveMember}
        />
      )}

      <Dialog
        open={Boolean(deleteCompany)}
        onOpenChange={(open) => {
          if (!open) setDeleteCompany(null);
        }}
      >
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
              onClick={() => deleteCompany && void handleDelete(deleteCompany)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              Ta bort
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
