'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { cn } from '@shared/lib/utils';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';

interface OfferTemplate {
  id: string;
  companyId?: string;
  name: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

  const canCreateTemplate = Boolean(selectedCompanyId);

  const goToCreateTemplate = useCallback(() => {
    if (!selectedCompanyId) {
      setError('Välj företag först innan du skapar en mall.');
      return;
    }
    router.push('/mallar/ny');
  }, [router, selectedCompanyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyId) {
        params.set('companyId', selectedCompanyId);
      }
      const res = await fetchWithRefresh(`/api/templates?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Fel ${res.status}`);
      }
      const json = (await res.json()) as { data: OfferTemplate[] };
      setTemplates(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePreview = useCallback(
    async (template: OfferTemplate) => {
      setPreviewing(template.id);
      setPreviewHtml(null);
      try {
        const templateContent =
          template.content ??
          (await (async () => {
            const templateRes = await fetchWithRefresh(`/api/templates/${template.id}`);
            const templateJson = (await templateRes.json().catch(() => ({}))) as {
              data?: OfferTemplate;
              detail?: string;
            };
            if (!templateRes.ok || !templateJson.data?.content) {
              throw new Error(templateJson.detail ?? `Kunde inte ladda mallens innehåll (${templateRes.status})`);
            }
            return templateJson.data.content;
          })());

        const res = await fetchWithRefresh('/api/templates/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: templateContent,
            branding: selectedCompanyBranding,
          }),
        });

        const json = (await res.json()) as { html?: string; detail?: string };
        if (!res.ok) {
          throw new Error(json.detail ?? `Fel ${res.status}`);
        }
        setPreviewHtml(json.html ?? '');
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
        const res = await fetchWithRefresh('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Kopia av ${template.name}`,
            companyId: (template.companyId ?? selectedCompanyId) || undefined,
            content: template.content,
          }),
        });
        if (!res.ok) {
          throw new Error(`Fel ${res.status}`);
        }
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
        const res = await fetchWithRefresh(`/api/templates/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error(`Fel ${res.status}`);
        }
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
      <div className="mb-8 flex items-start justify-between gap-4">
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
            if (selectedCompanyId) {
              router.prefetch('/mallar/ny');
            }
          }}
          disabled={!canCreateTemplate}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny mall
        </button>
      </div>

      {!companiesLoading && companies.length > 0 && (
        <div className="mb-6">
          <CompanyScopeSelector
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
            compact
            description="Välj företag först. Det styr vilka mallar du ser och vilket företag nya mallar kopplas till."
          />
        </div>
      )}

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

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar mallar...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-[var(--surface-alt)]">
              <tr>
                {['Mallnamn', 'Skapad', 'Uppdaterad', ''].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {templates.map((template) => (
                <tr key={template.id} className="group transition-colors hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-[var(--text-primary)]">{template.name}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(template.createdAt)}</td>
                  <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmtDate(template.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => void handlePreview(template)}
                        disabled={previewing === template.id}
                        className="flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
                        title="Förhandsgranska med exempeldata"
                      >
                        {previewing === template.id ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                        Förhandsgranska
                      </button>

                      <span className="text-[var(--border)]">·</span>

                      <button
                        type="button"
                        onClick={() => void handleDuplicate(template)}
                        disabled={duplicating === template.id}
                        className="flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
                        title="Duplicera mall"
                      >
                        {duplicating === template.id ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                        Duplicera
                      </button>

                      <span className="text-[var(--border)]">·</span>

                      <button
                        type="button"
                        onClick={() => router.push(`/mallar/${template.id}`)}
                        onMouseEnter={() => router.prefetch(`/mallar/${template.id}`)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Redigera
                      </button>

                      <span className="text-[var(--border)]">·</span>

                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ id: template.id, name: template.name })}
                        disabled={deleting === template.id}
                        className={cn(
                          'text-xs hover:underline disabled:opacity-40',
                          deleting === template.id ? 'text-[var(--text-muted)]' : 'text-red-500',
                        )}
                      >
                        {deleting === template.id ? 'Tar bort...' : 'Ta bort'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
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
                        disabled={!canCreateTemplate}
                        className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
                        style={{ boxShadow: '0 4px 12px var(--accent-subtle)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Skapa första mallen
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setPreviewing(null);
            setPreviewHtml(null);
          }}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-sm font-medium text-[var(--text-primary)]">Förhandsvisning</span>
                <span className="text-xs text-[var(--text-muted)]">- med exempeldata</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewing(null);
                  setPreviewHtml(null);
                }}
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
