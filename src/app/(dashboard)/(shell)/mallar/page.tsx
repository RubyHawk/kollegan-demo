'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  previewTemplate,
  type OfferTemplate,
} from '@shared/lib/api/templates.api';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function resolveTemplateContent(template: OfferTemplate) {
  if (template.content?.trim()) {
    return template.content;
  }
  return (await getTemplate(template.id)).content;
}

export default function TemplatesPage() {
  const router = useRouter();
  const {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    loading: companiesLoading,
  } = useActiveCompany();

  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const selectedCompanyBranding = useMemo(
    () =>
      selectedCompany
        ? {
            name: selectedCompany.name,
            website: selectedCompany.website,
            logoUrl: selectedCompany.logoUrl,
            senderEmail: selectedCompany.senderEmail,
            senderName: selectedCompany.senderName,
            emailHeaderConfig: selectedCompany.emailHeaderConfig,
          }
        : undefined,
    [selectedCompany],
  );

  const goToCreateTemplate = useCallback(() => {
    if (!selectedCompanyId) {
      setError('Välj ett företag ovan innan du skapar en mall.');
      return;
    }
    router.push('/mallar/ny');
  }, [router, selectedCompanyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await listTemplates({ companyId: selectedCompanyId || undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTemplates = useMemo(
    () =>
      query.trim()
        ? templates.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
        : templates,
    [templates, query],
  );

  const handlePreview = useCallback(
    async (template: OfferTemplate) => {
      setPreviewing(template.id);
      setPreviewHtml(null);
      try {
        const templateContent = await resolveTemplateContent(template);
        if (!templateContent?.trim()) {
          throw new Error('Kunde inte ladda mallens innehåll.');
        }
        setPreviewHtml(await previewTemplate({
          content: templateContent,
          branding: selectedCompanyBranding,
        }));
      } catch (e) {
        setError((e as Error).message);
        setPreviewing(null);
      }
    },
    [selectedCompanyBranding],
  );

  const handleDuplicate = useCallback(
    async (template: OfferTemplate) => {
      setDuplicating(template.id);
      try {
        const templateContent = await resolveTemplateContent(template);
        await createTemplate({
          name: `Kopia av ${template.name}`,
          companyId: (template.companyId ?? selectedCompanyId) || undefined,
          content: templateContent?.trim() ? templateContent : '{}',
        });
        await load();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDuplicating(null);
      }
    },
    [load, selectedCompanyId],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(id);
      setConfirmDelete(null);
      try {
        await deleteTemplate(id);
        await load();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDeleting(null);
      }
    },
    [load],
  );

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-semibold text-[var(--text-primary)]">Offertmallar</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Skapa och hantera offertmallar för det företag som är aktivt just nu.
          </p>
        </div>
        <button
          type="button"
          onClick={goToCreateTemplate}
          onMouseEnter={() => {
            if (selectedCompanyId) router.prefetch('/mallar/ny');
          }}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny mall
        </button>
      </div>

      {/* Controls: company selector + search */}
      {!companiesLoading && companies.length > 0 && (
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <CompanyScopeSelector
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={(id) => { setSelectedCompanyId(id); setQuery(''); }}
              compact
              description="Välj ett företag för att se och skapa mallar."
            />
          </div>
          {selectedCompanyId && (
            <div className="relative shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök mallar..."
                className="h-9 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-border)]"
              />
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar mallar...</p>
        </div>
      )}

      {/* No company selected */}
      {!loading && !selectedCompanyId && !companiesLoading && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Välj ett företag ovan för att se dina mallar.</p>
        </div>
      )}

      {/* Card grid */}
      {!loading && selectedCompanyId && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              previewing={previewing === template.id}
              duplicating={duplicating === template.id}
              deleting={deleting === template.id}
              onPreview={() => void handlePreview(template)}
              onDuplicate={() => void handleDuplicate(template)}
              onEdit={() => router.push(`/mallar/${template.id}`)}
              onDeleteRequest={() => setConfirmDelete({ id: template.id, name: template.name })}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && selectedCompanyId && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
          {query.trim() ? (
            <>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Inga mallar matchar &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Rensa sökning
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <span
                  className="absolute inset-0 rounded-2xl animate-[empty-state-ring_2.4s_ease-in-out_infinite]"
                  style={{ background: 'var(--accent-subtle)' }}
                />
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Inga mallar ännu</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Skapa din första offertmall för att snabba upp ditt arbetsflöde.
                </p>
              </div>
              <button
                type="button"
                onClick={goToCreateTemplate}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ boxShadow: '0 4px 12px var(--accent-subtle)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Skapa första mallen
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ta bort mall?</h2>
            </div>
            <div className="space-y-3 px-6 py-5">
              <p className="text-sm text-[var(--text-secondary)]">
                Mallen <span className="font-medium text-[var(--text-primary)]">&ldquo;{confirmDelete.name}&rdquo;</span> tas bort permanent.
              </p>
              <p className="text-xs text-[var(--text-muted)]">Befintliga offerter som redan skickats påverkas inte.</p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                type="button"
                onClick={() => void handleDelete(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleting === confirmDelete.id ? 'Tar bort...' : 'Ta bort'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)]"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => { setPreviewing(null); setPreviewHtml(null); }}
        >
          <div
            className="relative flex h-[min(90vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-sm font-medium text-[var(--text-primary)]">Förhandsvisning</span>
                <span className="text-xs text-[var(--text-muted)]">— med exempeldata</span>
              </div>
              <button
                type="button"
                onClick={() => { setPreviewing(null); setPreviewHtml(null); }}
                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {previewHtml === null ? (
              <div className="flex flex-1 items-center justify-center gap-3 text-[var(--text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-sm">Genererar förhandsvisning...</span>
              </div>
            ) : (
              <iframe
                srcDoc={previewHtml}
                className="flex-1 w-full border-0"
                sandbox="allow-same-origin"
                title="Förhandsvisning av offertmall"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type CardProps = {
  template: OfferTemplate;
  previewing: boolean;
  duplicating: boolean;
  deleting: boolean;
  onPreview: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
};

function TemplateCard({ template, previewing, duplicating, deleting, onPreview, onDuplicate, onEdit, onDeleteRequest }: CardProps) {
  const router = useRouter();
  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.11)]"
      onClick={onEdit}
      onMouseEnter={() => router.prefetch(`/mallar/${template.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
    >
      {/* Thumbnail */}
      <div className="relative flex h-[124px] items-center justify-center bg-gradient-to-b from-[var(--surface-alt)] to-[var(--surface-2)]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>

        {/* Hover action overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--surface)]/90 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <OverlayButton onClick={onPreview} title="Förhandsgranska" loading={previewing}>
            {previewing ? <Spinner /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </OverlayButton>
          <OverlayButton onClick={onDuplicate} title="Duplicera" loading={duplicating}>
            {duplicating ? <Spinner /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </OverlayButton>
          <OverlayButton onClick={onEdit} title="Redigera">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </OverlayButton>
          <OverlayButton onClick={onDeleteRequest} title="Ta bort" danger loading={deleting}>
            {deleting ? <Spinner /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </OverlayButton>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex flex-col gap-0.5 px-4 py-3">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{template.name}</p>
        <p className="text-xs text-[var(--text-muted)]">Uppdaterad {fmtDate(template.updatedAt)}</p>
      </div>
    </div>
  );
}

function OverlayButton({
  children,
  onClick,
  title,
  danger,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-500 hover:border-red-200 hover:bg-red-50'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
