'use client';

import type { RefObject } from 'react';
import { ExternalLink, FileText, LoaderCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { StatusBadge } from '@shared/ui/status-badge';

type PreviewCompany = {
  name: string;
};

type PreviewTemplate = {
  name: string;
};

type OfferWizardLivePreviewProps = {
  closeWizard: () => void;
  livePreviewHtml: string | null;
  previewDirty: boolean;
  livePreviewLoading: boolean;
  activeField: string | null;
  selectedCompany: PreviewCompany | null | undefined;
  selectedTemplate: PreviewTemplate | null | undefined;
  previewLooksImageLed: boolean;
  openTemplatePreview: () => void | Promise<void>;
  previewIframeRef: RefObject<HTMLIFrameElement | null>;
  lastActiveFieldRef: RefObject<string | null>;
  templatesCount: number;
};

export function OfferWizardLivePreview({
  closeWizard,
  livePreviewHtml,
  previewDirty,
  livePreviewLoading,
  activeField,
  selectedCompany,
  selectedTemplate,
  previewLooksImageLed,
  openTemplatePreview,
  previewIframeRef,
  lastActiveFieldRef,
  templatesCount,
}: OfferWizardLivePreviewProps) {
  return (
    <div className="relative hidden flex-1 flex-col overflow-auto bg-[var(--ui-bg)] px-8 py-8 lg:flex">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={closeWizard}
        title="Stäng (Esc)"
        className="absolute right-4 top-4 z-40"
      >
        <X size={16} strokeWidth={1.75} aria-hidden />
        Stäng
      </Button>

      {livePreviewHtml && (previewDirty || livePreviewLoading) ? (
        <div className="sticky top-0 z-30 mb-4 flex w-full justify-center pointer-events-none">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-3 py-1.5 text-[11px] text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-raised)]">
            {livePreviewLoading ? (
              <LoaderCircle size={14} strokeWidth={1.75} className="shrink-0 animate-spin text-[var(--ui-accent)]" aria-hidden />
            ) : (
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--ui-accent)]" aria-hidden />
            )}
            {livePreviewLoading
              ? activeField ? `Uppdaterar ${activeField}...` : 'Uppdaterar förhandsvisning...'
              : activeField ? `Skriver: ${activeField}` : 'Väntar på att uppdatera...'}
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {!livePreviewHtml && !livePreviewLoading ? (
          <motion.div
            key="preview-empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex min-h-full w-full items-center justify-center"
          >
            <div className="w-full max-w-3xl rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6">
              <div className="mb-5 flex items-center gap-2">
                <StatusBadge tone="neutral">Preview</StatusBadge>
                {selectedCompany ? <StatusBadge tone="accent">{selectedCompany.name}</StatusBadge> : null}
              </div>
              <EmptyState
                icon={FileText}
                title="Välj en mall som sätter strukturen"
                description="När du väljer en mall laddas kundens faktiska offertvy här till vänster. Förhandsvisningen uppdateras medan du fyller i mottagare, rader och detaljer."
              />
              {templatesCount === 0 ? (
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <a href="/mallar" target="_blank" rel="noreferrer">
                      Skapa din första mall
                      <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
                    </a>
                  </Button>
                </div>
              ) : null}
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <PreviewStep number="1" title="Välj mall" description="Börja med den dokumentstruktur som passar erbjudandet." />
                <PreviewStep number="2" title="Fyll mottagare" description="Använd kund- eller leaddata för att minska dubbelarbete." />
                <PreviewStep number="3" title="Se preview" description="Dokumentet uppdateras när offertens innehåll ändras." />
              </div>
            </div>
          </motion.div>
        ) : null}

        {livePreviewLoading && !livePreviewHtml ? (
          <motion.div
            key="preview-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col items-center justify-center gap-3 text-[var(--ui-text-muted)]"
          >
            <LoaderCircle size={24} strokeWidth={1.75} className="animate-spin text-[var(--ui-accent)]" aria-hidden />
            <p className="text-xs">Laddar mall...</p>
          </motion.div>
        ) : null}

        {livePreviewHtml ? (
          <motion.div
            key="preview-iframe"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative mx-auto w-full max-w-4xl"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="neutral">Livepreview</StatusBadge>
                  {previewLooksImageLed ? <StatusBadge tone="accent">Bildmall</StatusBadge> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--ui-text)]">{selectedTemplate?.name ?? 'Vald mall'}</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  Det här är den faktiska kundvyn som uppdateras medan du fyller i offerten.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => void openTemplatePreview()}>
                Öppna stort
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
              </Button>
            </div>

            <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
              <div className="mb-3 flex items-center justify-between text-[11px] text-[var(--ui-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--ui-accent)]" aria-hidden />
                  Dokumentyta
                </span>
                {selectedCompany ? <span>{selectedCompany.name}</span> : null}
              </div>
              <div className="relative overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]">
                {(livePreviewLoading || previewDirty) ? (
                  <div className="absolute inset-0 z-10 bg-[color-mix(in_srgb,var(--ui-surface-subtle)_75%,transparent)] backdrop-blur-[2px]">
                    {livePreviewLoading ? (
                      <div className="absolute right-4 top-4">
                        <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin text-[var(--ui-accent)]" aria-hidden />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <iframe
                  ref={previewIframeRef}
                  srcDoc={livePreviewHtml}
                  title="Live-förhandsvisning"
                  className="w-full"
                  style={{ border: 'none', height: '200px', display: 'block', overflow: 'hidden' }}
                  sandbox="allow-same-origin"
                  scrolling="no"
                  onLoad={(event) => {
                    const iframe = event.currentTarget;
                    const d = iframe.contentDocument;
                    if (!d) return;

                    if (d.documentElement) d.documentElement.style.overflow = 'hidden';
                    if (d.body) d.body.style.overflow = 'hidden';

                    const resize = () => {
                      try {
                        if (d.body) iframe.style.height = `${d.body.scrollHeight}px`;
                      } catch {}
                    };
                    resize();
                    d.querySelectorAll('img').forEach((img) => {
                      img.addEventListener('load', resize);
                    });

                    const style = d.createElement('style');
                    style.textContent = `
                      @keyframes highlight-fade {
                        0% { background: oklch(0.95 0.12 250 / 0.35); box-shadow: 0 0 0 3px oklch(0.44 0.19 250 / 0.2); border-radius: 3px; }
                        100% { background: transparent; box-shadow: none; }
                      }
                      [data-var].just-updated { animation: highlight-fade 1.2s ease-out forwards; }
                    `;
                    if (d.head) d.head.appendChild(style);

                    const fieldToVarKeys: Record<string, string[]> = {
                      Mottagare: ['recipientName', 'recipientCompany'],
                      'E-post': ['recipientEmail'],
                      Rubrik: ['title'],
                    };
                    const field = lastActiveFieldRef.current;
                    const varKeys = field ? (fieldToVarKeys[field] ?? []) : [];
                    if (varKeys.length > 0) {
                      let target: HTMLElement | null = null;
                      for (const key of varKeys) {
                        target = d.querySelector(`[data-var="${key}"]`) as HTMLElement | null;
                        if (target) break;
                      }
                      if (target) {
                        target.classList.add('just-updated');
                        const highlighted = target;
                        setTimeout(() => highlighted.classList.remove('just-updated'), 1300);

                        let scrollEl: HTMLElement | null = iframe.parentElement;
                        while (scrollEl && getComputedStyle(scrollEl).overflowY === 'visible') {
                          scrollEl = scrollEl.parentElement;
                        }
                        if (scrollEl) {
                          const scrollTop = iframe.offsetTop + target.offsetTop - scrollEl.clientHeight / 3;
                          scrollEl.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PreviewStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
      <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">{number}. {title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--ui-text-secondary)]">{description}</p>
    </div>
  );
}
