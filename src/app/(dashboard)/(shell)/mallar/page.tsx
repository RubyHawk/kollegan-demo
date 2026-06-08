'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Eye, FileText, Grid2X2, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  previewTemplate,
  type OfferTemplate,
} from '@shared/lib/api/templates.api';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { Button } from '@shared/ui/button';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
} from '@shared/ui/dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function resolveTemplateContent(template: OfferTemplate) {
  if (template.content?.trim()) return template.content;
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
    } catch {
      setError('Kunde inte ladda mallar. Kontrollera anslutningen och försök igen.');
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
        ? templates.filter((template) => template.name.toLowerCase().includes(query.toLowerCase()))
        : templates,
    [templates, query],
  );

  const handlePreview = useCallback(
    async (template: OfferTemplate) => {
      setPreviewing(template.id);
      setPreviewHtml(null);
      try {
        const templateContent = await resolveTemplateContent(template);
        if (!templateContent?.trim()) throw new Error('Missing template content');
        setPreviewHtml(await previewTemplate({ content: templateContent, branding: selectedCompanyBranding }));
      } catch {
        setError('Kunde inte förhandsgranska mallen. Försök igen.');
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
          companyId: template.companyId || selectedCompanyId,
          content: templateContent?.trim() ? templateContent : '{}',
        });
        await load();
      } catch {
        setError('Kunde inte duplicera mallen. Försök igen.');
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
      } catch {
        setError('Kunde inte ta bort mallen. Försök igen.');
      } finally {
        setDeleting(null);
      }
    },
    [load],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Offertmallar</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Skapa och hantera offertmallar för det företag som är aktivt just nu.
          </p>
        </div>
        <Button
          type="button"
          onClick={goToCreateTemplate}
          onMouseEnter={() => {
            if (selectedCompanyId) router.prefetch('/mallar/ny');
          }}
          disabled={!companiesLoading && companies.length > 0 && !selectedCompanyId}
          title={!companiesLoading && companies.length > 0 && !selectedCompanyId ? 'Välj ett företag nedan för att skapa en mall' : undefined}
        >
          <Plus size={16} strokeWidth={2} />
          Ny mall
        </Button>
      </div>

      {!companiesLoading && companies.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <CompanyScopeSelector
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={(id) => {
                setSelectedCompanyId(id);
                setQuery('');
              }}
              compact
              description="Välj ett företag för att se och skapa mallar."
            />
          </div>
          {selectedCompanyId ? (
            <div className="relative shrink-0">
              <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök mallar..."
                className="h-9 w-56 pl-8"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <InlineAlert tone="danger" className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="shrink-0 rounded-[var(--ui-radius-sm)] p-0.5 hover:bg-[var(--ui-danger-border)]/20">
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        </InlineAlert>
      ) : null}

      {loading ? (
        <LoadingState label="Laddar mallar..." />
      ) : !selectedCompanyId && !companiesLoading ? (
        <Panel>
          <EmptyState icon={Grid2X2} title="Välj ett företag" description="Välj ett företag ovan för att se dina mallar." />
        </Panel>
      ) : selectedCompanyId && filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              onPrefetch={() => router.prefetch(`/mallar/${template.id}`)}
              onDeleteRequest={() => setConfirmDelete({ id: template.id, name: template.name })}
            />
          ))}
        </div>
      ) : selectedCompanyId ? (
        <Panel>
          {query.trim() ? (
            <EmptyState
              icon={Search}
              title={`Inga mallar matchar "${query}"`}
              description="Justera sökningen eller visa alla mallar igen."
              actionLabel="Rensa sökning"
              onAction={() => setQuery('')}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Inga mallar ännu"
              description="Skapa din första offertmall för att snabba upp ditt arbetsflöde."
              actionLabel="Skapa första mallen"
              onAction={goToCreateTemplate}
            />
          )}
        </Panel>
      ) : null}

      <ConfirmDeleteDialog
        value={confirmDelete}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        onConfirm={(id) => void handleDelete(id)}
      />

      <PreviewDialog
        open={Boolean(previewing)}
        html={previewHtml}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewing(null);
            setPreviewHtml(null);
          }
        }}
      />
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
  onPrefetch: () => void;
  onDeleteRequest: () => void;
};

function TemplateCard({ template, previewing, duplicating, deleting, onPreview, onDuplicate, onEdit, onPrefetch, onDeleteRequest }: CardProps) {
  return (
    <Panel
      role="button"
      tabIndex={0}
      padding="none"
      onClick={onEdit}
      onMouseEnter={onPrefetch}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onEdit();
      }}
      className="group cursor-pointer overflow-hidden transition-colors hover:bg-[var(--ui-surface-hover)]"
    >
      <div className="relative flex h-[112px] items-center justify-center bg-[var(--ui-surface-subtle)]">
        <FileText size={24} strokeWidth={1.75} className="text-[var(--ui-text-muted)]" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--ui-surface)]/92 opacity-0 transition-opacity group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
          <IconAction onClick={onPreview} title="Förhandsgranska" loading={previewing}>
            <Eye size={16} strokeWidth={1.75} />
          </IconAction>
          <IconAction onClick={onDuplicate} title="Duplicera" loading={duplicating}>
            <Copy size={16} strokeWidth={1.75} />
          </IconAction>
          <IconAction onClick={onEdit} title="Redigera">
            <Pencil size={16} strokeWidth={1.75} />
          </IconAction>
          <IconAction onClick={onDeleteRequest} title="Ta bort" tone="danger" loading={deleting}>
            <Trash2 size={16} strokeWidth={1.75} />
          </IconAction>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="truncate text-sm font-medium text-[var(--ui-text)]">{template.name}</p>
        <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">Uppdaterad {fmtDate(template.updatedAt)}</p>
      </div>
    </Panel>
  );
}

function IconAction({ children, onClick, title, tone = 'neutral', loading }: { children: ReactNode; onClick: () => void; title: string; tone?: 'neutral' | 'danger'; loading?: boolean }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={tone === 'danger' ? 'ghost' : 'secondary'}
      title={title}
      onClick={onClick}
      loading={loading}
      className={tone === 'danger' ? 'text-[var(--ui-danger-text)] hover:bg-[var(--ui-danger-bg)]' : undefined}
    >
      {children}
    </Button>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-[var(--ui-text-muted)]">
      <Loader2 size={18} strokeWidth={1.75} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ConfirmDeleteDialog({ value, deleting, onOpenChange, onConfirm }: { value: { id: string; name: string } | null; deleting: string | null; onOpenChange: (open: boolean) => void; onConfirm: (id: string) => void }) {
  return (
    <Dialog open={Boolean(value)} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Ta bort mall?</DialogTitle>
          <DialogDescription>
            Mallen <span className="font-medium text-[var(--ui-text)]">{value?.name}</span> tas bort permanent. Befintliga offerter som redan skickats påverkas inte.
          </DialogDescription>
        </DialogHeader>
        <ModalActionFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button type="button" variant="destructive" loading={Boolean(value && deleting === value.id)} onClick={() => value && onConfirm(value.id)}>
            Ta bort
          </Button>
        </ModalActionFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ open, html, onOpenChange }: { open: boolean; html: string | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="fullscreen" size="lg" showMobileClose className="flex h-[min(90dvh,900px)] flex-col">
        <DialogHeader className="border-b border-[var(--ui-border)] pr-12">
          <div className="flex items-center gap-2">
            <Eye size={16} strokeWidth={1.75} className="text-[var(--ui-text-muted)]" />
            <DialogTitle>Förhandsvisning</DialogTitle>
          </div>
          <DialogDescription>Med exempeldata</DialogDescription>
        </DialogHeader>
        <ModalBody className="p-0">
          {html === null ? (
            <LoadingState label="Genererar förhandsvisning..." />
          ) : (
            <iframe srcDoc={html} className="h-full w-full border-0" sandbox="allow-same-origin" title="Förhandsvisning av offertmall" />
          )}
        </ModalBody>
      </DialogContent>
    </Dialog>
  );
}
