'use client';

import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
              <div className="hidden lg:flex flex-1 bg-slate-100 dark:bg-slate-900/60 overflow-auto flex-col items-center py-10 px-8 relative">
                {/* Floating close button */}
                <button onClick={closeWizard} title="Stäng (Esc)"
                  className="absolute right-4 top-4 z-40 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 backdrop-blur-sm transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Stäng
                </button>
                {/* Dirty / updating badge */}
                {livePreviewHtml && (previewDirty || livePreviewLoading) && (
                  <div className="sticky top-0 z-30 w-full flex justify-center pointer-events-none mb-4" style={{ marginTop: '-2rem' }}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-[11px] text-slate-500 dark:text-slate-400 backdrop-blur-sm mt-8">
                      {livePreviewLoading ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--accent)] shrink-0">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0"/>
                      )}
                      {livePreviewLoading
                        ? (activeField ? `Uppdaterar ${activeField}…` : 'Uppdaterar förhandsvisning…')
                        : (activeField ? `Skriver: ${activeField}` : 'Väntar på att uppdatera…')}
                    </div>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {!livePreviewHtml && !livePreviewLoading && (
                    <motion.div key="preview-empty"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex h-full w-full items-center justify-center">
                      <div className="relative w-full max-w-4xl">
                        <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(240,244,250,0.88)_45%,_rgba(226,232,240,0.74)_100%)]" />
                        <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/55 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                          <div className="flex items-start justify-between gap-8">
                            <div className="max-w-xl">
                              <div className="mb-4 flex items-center gap-2">
                                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                                  Preview
                                </span>
                                {selectedCompany && (
                                  <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-1 text-[11px] font-medium text-[var(--accent)]">
                                    {selectedCompany.name}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-3xl font-semibold leading-tight text-slate-900">
                                Välj en mall som sätter tonen för offerten.
                              </h3>
                              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                                Den stora ytan här ska kännas som ett dokumentbord, inte som en tom buggy ruta.
                                När du väljer en mall laddar vi direkt kundens faktiska offertutseende här till vänster.
                              </p>
                            </div>
                            <div className="hidden xl:flex rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                              <div className="w-[240px] rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
                                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]/35" />
                                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]/18" />
                                </div>
                                <div className="mt-4 h-10 rounded-2xl bg-[var(--accent)]/12" />
                                <div className="mt-3 space-y-2">
                                  <div className="h-2 rounded-full bg-slate-200" />
                                  <div className="h-2 w-4/5 rounded-full bg-slate-200/80" />
                                  <div className="h-24 rounded-[20px] bg-slate-100" />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="h-9 rounded-xl bg-slate-100" />
                                    <div className="h-9 rounded-xl bg-[var(--accent)]/10" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-8 grid gap-4 md:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200 bg-white/82 p-5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">1. Välj mall</p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">Struktur först</p>
                              <p className="mt-1 text-xs leading-6 text-slate-600">
                                Välj en mall till höger. Bildmallar och dokumentmallar ska kännas tydliga redan innan du går vidare.
                              </p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white/82 p-5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">2. Mottagare</p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">Fyll bara det viktiga</p>
                              <p className="mt-1 text-xs leading-6 text-slate-600">
                                När mottagaren är ifylld går du vidare utan att hela ytan känns tom eller halvfärdig.
                              </p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white/82 p-5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">3. Livepreview</p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">Se dokumentet växa fram</p>
                              <p className="mt-1 text-xs leading-6 text-slate-600">
                                Förhandsvisningen uppdateras direkt så att vänstersidan känns avsiktlig och användbar från start.
                              </p>
                            </div>
                          </div>
                          {templatesCount === 0 && (
                            <div className="mt-8">
                              <a href="/mallar" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90">
                                Skapa din första mall
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="7" y1="17" x2="17" y2="7"/>
                                  <polyline points="7 7 17 7 17 17"/>
                                </svg>
                              </a>
                            </div>
                          )}
                          <div className="hidden">
                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">Välj en mall för att se förhandsvisning</p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">Mallen styr offertens utseende. Välj bland dina mallar i panelen till höger — förhandsvisningen uppdateras live.</p>
                      </div>
                      {templatesCount === 0 && (
                        <a href="/mallar" target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline font-medium">
                          Skapa din första mall →
                        </a>
                      )}
                          </div>
                      </div>
                    </motion.div>
                  )}
                  {livePreviewLoading && !livePreviewHtml && (
                    <motion.div key="preview-loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--accent)]">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      <p className="text-xs">Laddar mall…</p>
                    </motion.div>
                  )}
                  {livePreviewHtml && (
                    <motion.div key="preview-iframe"
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="relative w-full max-w-4xl">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm">
                              Livepreview
                            </span>
                            {previewLooksImageLed && (
                              <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-3 py-1 text-[11px] font-medium text-[var(--accent)] shadow-sm">
                                Bildmall
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedTemplate?.name ?? 'Vald mall'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Det här är den faktiska kundvyn som uppdateras medan du fyller i offerten.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void openTemplatePreview()}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:text-[var(--accent)]"
                        >
                          Öppna stort
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7"/>
                            <polyline points="7 7 17 7 17 17"/>
                          </svg>
                        </button>
                      </div>
                      <div className="rounded-[32px] border border-white/70 bg-white/50 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                        <div className="mb-4 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/35" />
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]/18" />
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium">
                            Dokumentyta
                          </span>
                        </div>
                        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
                      {(livePreviewLoading || previewDirty) && (
                        <div className={`absolute inset-0 z-10 rounded-xl transition-all ${livePreviewLoading ? 'bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-[2px]' : 'bg-slate-100/20 dark:bg-slate-900/20'}`}>
                          {livePreviewLoading && (
                            <div className="absolute top-4 right-4">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--accent)]">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                      <iframe
                        ref={previewIframeRef}
                        srcDoc={livePreviewHtml}
                        title="Live-förhandsvisning"
                        className="w-full"
                        style={{ border: 'none', height: '200px', display: 'block', overflow: 'hidden' }}
                        sandbox="allow-same-origin"
                        scrolling="no"
                        onLoad={(e) => {
                          const iframe = e.currentTarget;
                          const d = iframe.contentDocument;
                          if (!d) return;

                          // Suppress scrollbar
                          if (d.documentElement) d.documentElement.style.overflow = 'hidden';
                          if (d.body) d.body.style.overflow = 'hidden';

                          const resize = () => {
                            try {
                              if (d.body) iframe.style.height = `${d.body.scrollHeight}px`;
                            } catch { /* cross-origin */ }
                          };
                          resize();
                          d.querySelectorAll('img').forEach((img) => { img.addEventListener('load', resize); });

                          // ── Inject highlight animation ───────────────────────────
                          const style = d.createElement('style');
                          style.textContent = `
                            @keyframes highlight-fade {
                              0%   { background: oklch(0.95 0.12 250 / 0.35); box-shadow: 0 0 0 3px oklch(0.44 0.19 250 / 0.2); border-radius: 3px; }
                              100% { background: transparent; box-shadow: none; }
                            }
                            [data-var].just-updated { animation: highlight-fade 1.2s ease-out forwards; }
                          `;
                          if (d.head) d.head.appendChild(style);

                          // ── Highlight the field that triggered this preview ──────
                          const fieldToVarKeys: Record<string, string[]> = {
                            'Mottagare': ['recipientName', 'recipientCompany'],
                            'E-post':    ['recipientEmail'],
                            'Rubrik':    ['title'],
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
                              const t = target; // closure capture
                              setTimeout(() => t.classList.remove('just-updated'), 1300);

                              // ── Scroll preview panel to show the highlighted element ──
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
                  )}
                </AnimatePresence>
              </div>
  );
}
