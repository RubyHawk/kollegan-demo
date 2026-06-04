'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowSquareOut, Buildings, FileText, Package, Plus, UsersThree } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import {
  createCompany,
  deleteCompany as deleteCompanyRecord,
  listCompanies,
  listCompanyMembers,
  removeCompanyMember,
  updateCompany,
  upsertCompanyMember,
  type Company,
} from '@shared/lib/api/companies.api';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  CompanyMembersDialog,
  type AssignableUserRecord,
  type CompanyMemberRecord,
  type NewCompanyAccountForm,
} from './company-members-dialog';
import { CompanyModal, type CompanyForm } from './company-modal';
import { CompanyOverviewDialog } from './company-overview-dialog';
import { CompanyRow } from './company-row';
import { LeadIntakeDialog } from './lead-intake-dialog';

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
  const [leadIntakeCompany, setLeadIntakeCompany] = useState<Company | null>(null);
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
      setCompanies(await listCompanies({ search: search || undefined }));
    } catch {
      setError('Kunde inte ladda företag. Kontrollera anslutningen och försök igen.');
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
      const payload = await listCompanyMembers(company.id);
      setMembers(payload.members);
      setAvailableUsers(payload.availableUsers);
    } catch {
      setError('Kunde inte ladda medlemmar. Försök igen.');
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
          addressLine1: form.addressLine1.trim() || undefined,
          addressLine2: form.addressLine2.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          city: form.city.trim() || undefined,
          region: form.region.trim() || undefined,
          country: form.country.trim() || undefined,
          website: form.website.trim() || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
        };

        const savedCompany = editCompany
          ? await updateCompany(editCompany.id, body)
          : await createCompany(body);

        closeModal();
        await Promise.all([load(), reloadScopedCompanies()]);

        if (!selectedCompanyId || !editCompany) {
          setSelectedCompanyId(savedCompany.id);
        }
      } catch {
        setError('Kunde inte spara företaget. Kontrollera anslutningen och försök igen.');
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
        await upsertCompanyMember(membersCompany.id, { userId, role });
        await loadMembers(membersCompany);
      } catch {
        setError('Kunde inte lägga till medlem. Försök igen.');
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
        await upsertCompanyMember(membersCompany.id, {
          mode: 'create',
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          role: form.role,
        });
        await loadMembers(membersCompany);
      } catch {
        setError('Kunde inte skapa kontoanvändare. Försök igen.');
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
        await removeCompanyMember(membersCompany.id, userId);
        await loadMembers(membersCompany);
      } catch {
        setError('Kunde inte ta bort medlem. Försök igen.');
      } finally {
        setMemberSaving(false);
      }
    },
    [loadMembers, membersCompany],
  );

  const handleDelete = useCallback(
    async (company: Company) => {
      try {
        await deleteCompanyRecord(company.id);
      } catch {
        setError('Kunde inte ta bort företaget. Försök igen.');
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
              Håll branding, mallar, produkter och medlemmar samlade per företag.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Varje företag styr sitt eget offertuttryck. Välj aktivt företag för att byta vilka mallar,
              produkter och kontaktuppgifter som används i resten av flödet.
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
              placeholder="Sök företag..."
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
              <p className="mt-1 text-xs text-[var(--text-muted)]">Skapa ditt första företag för att börja styra branding och scope.</p>
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
                  onLeadIntake={setLeadIntakeCompany}
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
        onOpenTemplates={() => {
          const targetCompany = editCompany ?? selectedCompany;
          if (!targetCompany) return;
          openTemplatesForCompany(targetCompany);
        }}
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

      <LeadIntakeDialog
        open={Boolean(leadIntakeCompany)}
        company={leadIntakeCompany}
        onOpenChange={(open) => {
          if (!open) setLeadIntakeCompany(null);
        }}
      />

      <ConfirmDestructiveDialog
        open={Boolean(deleteCompany)}
        onOpenChange={(open) => {
          if (!open) setDeleteCompany(null);
        }}
        title={deleteCompany ? `Ta bort ${deleteCompany.name}?` : 'Ta bort företag?'}
        description="Företaget tas bort från registret och kan inte återställas automatiskt."
        confirmLabel="Ta bort"
        onConfirm={() => {
          if (!deleteCompany) return;
          void handleDelete(deleteCompany);
        }}
      />
    </div>
  );
}
