'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ExternalLink, FileText, Package, Plus, Search, Users } from 'lucide-react';
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
import { Button } from '@shared/ui/button';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
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
        setError('Kunde inte skapa konto-användare. Försök igen.');
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
    <div className="space-y-5">
      <Panel padding="none" className="overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-[var(--ui-border)] px-5 py-5 xl:border-b-0 xl:border-r">
            <StatusBadge tone="accent">Företag</StatusBadge>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-[var(--ui-text)]">
              Håll branding, mallar, produkter och medlemmar samlade per företag.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">
              Varje företag styr sitt eget offertuttryck. Välj aktivt företag för att byta vilka mallar,
              produkter och kontaktuppgifter som används i resten av flödet.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={openCreate}>
                <Plus size={16} strokeWidth={1.75} />
                Nytt företag
              </Button>
              {selectedCompany ? (
                <>
                  <Button type="button" variant="secondary" onClick={() => openTemplatesForCompany(selectedCompany)}>
                    <FileText size={16} strokeWidth={1.75} />
                    Öppna mallar för {selectedCompany.name}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => openProductsForCompany(selectedCompany)}>
                    <Package size={16} strokeWidth={1.75} />
                    Öppna produkter
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard icon={Building2} label="Företag" value={companies.length} description="Aktiva företag i ditt offertflöde." />
            <MetricCard
              icon={ExternalLink}
              label="Valt nu"
              value={selectedCompany?.name ?? 'Inget valt ännu'}
              description="Det här företaget styr vilka mallar och produkter som syns."
            />
            <MetricCard
              icon={Users}
              label="Behörighet"
              value="Staff + företagsadmin"
              description="Skapa företag, koppla medlemmar och bygg branding per bolag."
            />
          </div>
        </div>
      </Panel>

      <CompanyScopeSelector
        companies={scopedCompanies}
        selectedCompanyId={selectedCompanyId}
        onSelect={setSelectedCompanyId}
        compact
        title="Välj företag att arbeta i"
        description="Det här valet påverkar offertmallar, produktbibliotek och branding i resten av systemet."
      />

      <Panel padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--ui-border)] px-5 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--ui-text)]">Företagsöversikt</h3>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
              Redigera branding, hantera medlemmar och öppna rätt mallar och produkter för varje företag.
            </p>
          </div>

          <div className="relative">
            <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <Input
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;
                setSearchInput(value);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => setSearch(value), 300);
              }}
              placeholder="Sök företag..."
              className="pl-9 md:w-60"
            />
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {error ? <InlineAlert tone="danger" className="mb-4">{error}</InlineAlert> : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface-subtle)]" />
              ))}
            </div>
          ) : null}

          {!loading && companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Inga företag hittades"
              description="Skapa ditt första företag för att börja styra branding och scope."
              actionLabel="Nytt företag"
              onAction={openCreate}
            />
          ) : null}

          {!loading && companies.length > 0 ? (
            <Panel padding="none" className="overflow-hidden">
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
            </Panel>
          ) : null}
        </div>
      </Panel>

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

      {membersCompany ? (
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
      ) : null}

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

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <Panel variant="subtle" className="space-y-3">
      <div className="flex items-center gap-2 text-[var(--ui-text-muted)]">
        <Icon size={16} strokeWidth={1.75} />
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="truncate text-lg font-semibold text-[var(--ui-text)]">{value}</p>
      <p className="text-sm leading-5 text-[var(--ui-text-muted)]">{description}</p>
    </Panel>
  );
}
