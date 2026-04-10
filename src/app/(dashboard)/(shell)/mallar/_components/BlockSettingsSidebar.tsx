'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import type { HFCtxValue } from './header-footer-context';
import {
  DEFAULT_DOCUMENT_NOTES_HEADING,
  DEFAULT_DOCUMENT_TERMS_BODY,
  DEFAULT_DOCUMENT_TERMS_HEADING,
  PAGE_ROLE_LABELS,
} from './template-doc';
import { uploadTemplateImage } from './template-image-upload';
import {
  PRESENTATION_PAGE_HEIGHT,
  PRESENTATION_PAGE_WIDTH,
  syncPresentationPageHeightForActivePage,
} from './presentation-page-height';
import { cn } from '@shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
} from '@shared/ui/dialog';
import { CaretDown, PencilSimpleLine } from '@phosphor-icons/react';

type ActiveBlock = 'image' | 'table' | 'signatureBlock' | 'variable' | null;

export default function BlockSettingsSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const [active, setActive] = useState<ActiveBlock>(null);

  const activePage = hf?.pages[hf.activeIdx] ?? null;
  const isDocumentPage = activePage?.kind === 'document';

  useEffect(() => {
    if (!editor) return;
    const activeEditor = editor;
    function update() {
      if (activeEditor.isActive('image')) setActive('image');
      else if (activeEditor.isActive('table')) setActive('table');
      else if (activeEditor.isActive('signatureBlock')) setActive('signatureBlock');
      else if (activeEditor.isActive('variable')) setActive('variable');
      else setActive(null);
    }
    update();
    activeEditor.on('selectionUpdate', update);
    activeEditor.on('transaction', update);
    return () => {
      activeEditor.off('selectionUpdate', update);
      activeEditor.off('transaction', update);
    };
  }, [editor]);

  if (!hf) return null;

  return (
    <aside className="hidden w-[288px] shrink-0 xl:flex flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface-1)]">
      {isDocumentPage ? (
        <StructuredOfferInspector key={activePage?.id ?? 'document-page'} hf={hf} />
      ) : (
        <div className="space-y-2 p-2">
          {active === 'image' && editor && <ImageInspector editor={editor} />}
          {active === 'table' && <TableInspector />}
          {active === 'signatureBlock' && editor && <SignatureInspector editor={editor} />}
          {active === 'variable' && editor && <VariableInspector editor={editor} />}
          {active === null && (
            <>
              <PresentationPageInspector hf={hf} />
              <DocumentDefaultsInspector hf={hf} />
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function StructuredOfferInspector({ hf }: { hf: HFCtxValue }) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const page = hf.pages[hf.activeIdx];
  const document = page.document ?? {};
  const [dialogMode, setDialogMode] = useState<'pageLabel' | 'terms' | 'notes' | 'background' | null>(null);
  const [pageLabelDraft, setPageLabelDraft] = useState(page.label);
  const [termsHeadingDraft, setTermsHeadingDraft] = useState(document.termsHeading ?? DEFAULT_DOCUMENT_TERMS_HEADING);
  const [termsBodyDraft, setTermsBodyDraft] = useState(document.termsBody ?? DEFAULT_DOCUMENT_TERMS_BODY);
  const [notesHeadingDraft, setNotesHeadingDraft] = useState(document.notesHeading ?? DEFAULT_DOCUMENT_NOTES_HEADING);
  const [backgroundDraft, setBackgroundDraft] = useState(document.backgroundImageSrc ?? '');
  const visibleBlockCount = [
    document.showLogo ?? true,
    document.showSenderDetails ?? true,
    document.showCustomerBlock ?? true,
    document.showIntro ?? true,
    document.showLineItems ?? true,
    document.showSummary ?? true,
    document.showTerms ?? true,
    document.showNotes ?? true,
    document.showFooter ?? true,
  ].filter(Boolean).length;

  const openDialog = (mode: 'pageLabel' | 'terms' | 'notes' | 'background') => {
    setPageLabelDraft(page.label);
    setTermsHeadingDraft(document.termsHeading ?? DEFAULT_DOCUMENT_TERMS_HEADING);
    setTermsBodyDraft(document.termsBody ?? DEFAULT_DOCUMENT_TERMS_BODY);
    setNotesHeadingDraft(document.notesHeading ?? DEFAULT_DOCUMENT_NOTES_HEADING);
    setBackgroundDraft(document.backgroundImageSrc ?? '');
    setDialogMode(mode);
  };

  const saveDialog = () => {
    if (dialogMode === 'pageLabel') {
      hf.renamePage(hf.activeIdx, pageLabelDraft.trim() || 'Offertsida');
    } else if (dialogMode === 'terms') {
      hf.patchActivePage({
        document: {
          ...document,
          termsHeading: termsHeadingDraft.trim() || DEFAULT_DOCUMENT_TERMS_HEADING,
          termsBody: termsBodyDraft.trim() || DEFAULT_DOCUMENT_TERMS_BODY,
        },
      });
    } else if (dialogMode === 'notes') {
      hf.patchActivePage({
        document: {
          ...document,
          notesHeading: notesHeadingDraft.trim() || DEFAULT_DOCUMENT_NOTES_HEADING,
        },
      });
    } else if (dialogMode === 'background') {
      hf.patchActivePage({
        document: {
          ...document,
          backgroundImageSrc: backgroundDraft.trim(),
        },
      });
    }
    setDialogMode(null);
  };

  return (
    <>
      <div className="space-y-2 p-2">
        <div className="rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-0)_100%)] px-3 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Strukturerad offertsida</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">
            {'Tyngre textf\u00e4lt \u00f6ppnas i dialogrutor, medan layoutval och synliga block ligger i hopf\u00e4llbara sektioner.'}
          </p>
        </div>

        <InspectorDisclosure
          title={'Sid\u00f6versikt'}
          subtitle={'Rubrik, PDF-beteende och sidtyp f\u00f6r den h\u00e4r systemstyrda sidan.'}
          badge="Grund"
          defaultOpen
        >
          <div className="space-y-2">
            <EditableSummaryCard
              label={'Offertsidans rubrik'}
              value={page.label}
              description={'Visas som huvudrubrik i den publika offerten och i mallens f\u00f6rhandsvisning.'}
              actionLabel={'\u00c4ndra rubrik'}
              onClick={() => openDialog('pageLabel')}
            />

            <ToggleCard
              title={'Med i kundens PDF'}
              description={
                page.includeInCustomerPdf === false
                  ? 'Visas bara i webbversionen'
                  : 'F\u00f6ljer med i nedladdad PDF'
              }
              checked={page.includeInCustomerPdf !== false}
              onChange={(checked) => hf.patchActivePage({ includeInCustomerPdf: checked })}
            />

            <StaticCard
              title={'Sidmodell'}
              description={'Strukturerad offert med l\u00e5st sekvens f\u00f6r pris, summering och juridik.'}
              badge="System"
            />
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title="Layout & tydlighet"
          subtitle={'Rytm, luft och hur de fasta blocken upplevs visuellt i canvasen.'}
          badge={document.introLayout === 'roomy' ? 'Rymlig' : 'Kompakt'}
          defaultOpen
        >
          <div className="space-y-2">
            <Field label="Summering">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-[11px] leading-5 text-[var(--text-secondary)]">
                {'Summeringen visas alltid som en smal box under produkter och tj\u00e4nster, precis innan juridiska villkor.'}
              </div>
            </Field>

            <Field label={'Fri textyta'}>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceButton
                  active={(document.introLayout ?? 'compact') === 'compact'}
                  onClick={() => hf.patchActivePage({ document: { ...document, introLayout: 'compact' } })}
                >
                  Kompakt
                </ChoiceButton>
                <ChoiceButton
                  active={(document.introLayout ?? 'compact') === 'roomy'}
                  onClick={() => hf.patchActivePage({ document: { ...document, introLayout: 'roomy' } })}
                >
                  Rymlig
                </ChoiceButton>
              </div>
            </Field>
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title={'Synliga delar'}
          subtitle={'Sl\u00e5 av eller p\u00e5 de systemblock som kunden ska se p\u00e5 offertsidan.'}
          badge={`${visibleBlockCount}/9 aktiva`}
        >
          <div className="space-y-1">
            <ToggleRow label="Logo" checked={document.showLogo ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showLogo: checked } })} />
            <ToggleRow label={'Avs\u00e4ndare'} checked={document.showSenderDetails ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showSenderDetails: checked } })} />
            <ToggleRow label="Kundblock" checked={document.showCustomerBlock ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showCustomerBlock: checked } })} />
            <ToggleRow label={'Fri textyta'} checked={document.showIntro ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showIntro: checked } })} />
            <ToggleRow label={'Produkter och tj\u00e4nster'} checked={document.showLineItems ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showLineItems: checked } })} />
            <ToggleRow label="Summering" checked={document.showSummary ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showSummary: checked } })} />
            <ToggleRow label={'Juridiska villkor'} checked={document.showTerms ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showTerms: checked } })} />
            <ToggleRow label={'Anteckningar'} checked={document.showNotes ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showNotes: checked } })} />
            <ToggleRow label="Footer" checked={document.showFooter ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showFooter: checked } })} />
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title="Bakgrund & watermark"
          subtitle={'Bakgrundsbild, styrka och placering f\u00f6r att skapa mer separation i sidan.'}
          badge={document.backgroundImageSrc ? 'Aktiv' : 'Ingen'}
        >
          <div className="space-y-2">
            <EditableSummaryCard
              label="Bakgrundsbild"
              value={document.backgroundImageSrc ? 'Bakgrund kopplad' : 'Ingen bakgrund vald'}
              description={
                document.backgroundImageSrc
                  ? truncateText(document.backgroundImageSrc, 88)
                  : 'L\u00e4gg in en bildl\u00e4nk eller ladda upp en fil f\u00f6r mer djup i sidan.'
              }
              actionLabel={'\u00d6ppna l\u00e4nkf\u00e4lt'}
              onClick={() => openDialog('background')}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className={secondaryButtonClass}
              >
                Ladda upp bild
              </button>
              {document.backgroundImageSrc && (
                <button
                  type="button"
                  onClick={() => hf.patchActivePage({ document: { ...document, backgroundImageSrc: '' } })}
                  className={secondaryButtonClass}
                >
                  Rensa
                </button>
              )}
            </div>

            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  const src = await uploadTemplateImage(file);
                  hf.patchActivePage({ document: { ...document, backgroundImageSrc: src } });
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bakgrunden.');
                }
              }}
            />

            <Field label={'Bakgrundsstyrka'}>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={document.backgroundOpacity ?? 0.08}
                onChange={(event) => hf.patchActivePage({ document: { ...document, backgroundOpacity: Number(event.target.value) } })}
                className="w-full accent-[var(--accent)]"
              />
            </Field>

            <Field label="Placering">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'top', label: 'Topp' },
                  { value: 'bottom', label: 'Botten' },
                  { value: 'full', label: 'Hel sida' },
                ].map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={(document.watermarkMode ?? 'bottom') === option.value}
                    onClick={() => hf.patchActivePage({ document: { ...document, watermarkMode: option.value as 'top' | 'bottom' | 'full' } })}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </Field>
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title={'Texter som g\u00e5r att \u00e4ndra'}
          subtitle={'L\u00e4ngre textf\u00e4lt \u00f6ppnas i rena dialogrutor i st\u00e4llet f\u00f6r i sidpanelen.'}
          badge="Dialog"
          defaultOpen
        >
          <div className="space-y-2">
            <EditableSummaryCard
              label={'Juridiska villkor'}
              value={document.termsHeading ?? DEFAULT_DOCUMENT_TERMS_HEADING}
              description={truncateText(document.termsBody ?? DEFAULT_DOCUMENT_TERMS_BODY, 120)}
              actionLabel={'Redigera juridik'}
              onClick={() => openDialog('terms')}
            />

            <EditableSummaryCard
              label={'Anteckningsrubrik'}
              value={document.notesHeading ?? DEFAULT_DOCUMENT_NOTES_HEADING}
              description={'Anv\u00e4nds n\u00e4r offerten har en separat kommentar eller projektspecifik notering.'}
              actionLabel={'Redigera anteckning'}
              onClick={() => openDialog('notes')}
            />

            <div className="rounded-xl border border-dashed border-[var(--accent-border)] bg-[var(--accent-subtle)]/55 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">{'Fri offerttext skrivs direkt i canvasen'}</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                {'Den stora introytan p\u00e5 sidan \u00e4r markerad som skrivbar, s\u00e5 du slipper fler textf\u00e4lt i panelen.'}
              </p>
            </div>
          </div>
        </InspectorDisclosure>
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent mobileVariant="sheet" size="md" showMobileClose>
          <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[var(--border)] pr-16">
            <DialogTitle>{getDialogTitle(dialogMode)}</DialogTitle>
            <DialogDescription>{getDialogDescription(dialogMode)}</DialogDescription>
          </DialogHeader>

          <ModalBody className="space-y-4">
            {dialogMode === 'pageLabel' && (
              <Field label={'Rubrik p\u00e5 sidan'}>
                <input
                  type="text"
                  value={pageLabelDraft}
                  onChange={(event) => setPageLabelDraft(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </Field>
            )}

            {dialogMode === 'terms' && (
              <>
                <Field label={'Rubrik f\u00f6r juridik'}>
                  <input
                    type="text"
                    value={termsHeadingDraft}
                    onChange={(event) => setTermsHeadingDraft(event.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                </Field>
                <Field label={'Standardtext'}>
                  <textarea
                    rows={8}
                    value={termsBodyDraft}
                    onChange={(event) => setTermsBodyDraft(event.target.value)}
                    className={textareaClass}
                  />
                </Field>
              </>
            )}

            {dialogMode === 'notes' && (
              <Field label={'Rubrik f\u00f6r anteckningar'}>
                <input
                  type="text"
                  value={notesHeadingDraft}
                  onChange={(event) => setNotesHeadingDraft(event.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </Field>
            )}

            {dialogMode === 'background' && (
              <>
                <Field label={'Bildl\u00e4nk'}>
                  <input
                    type="url"
                    value={backgroundDraft}
                    onChange={(event) => setBackgroundDraft(event.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                    autoFocus
                  />
                </Field>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-[12px] leading-5 text-[var(--text-secondary)]">
                  {'Vill du hellre ladda upp en fil kan du fortfarande g\u00f6ra det i sidpanelen under samma sektion.'}
                </div>
              </>
            )}
          </ModalBody>

          <ModalActionFooter>
            <button
              type="button"
              onClick={() => setDialogMode(null)}
              className={secondaryButtonClass}
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={saveDialog}
              className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:brightness-[0.98]"
            >
              Spara
            </button>
          </ModalActionFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getDialogTitle(mode: 'pageLabel' | 'terms' | 'notes' | 'background' | null): string {
  switch (mode) {
    case 'pageLabel':
      return '\u00c4ndra rubrik';
    case 'terms':
      return 'Redigera juridiska villkor';
    case 'notes':
      return 'Redigera anteckningsrubrik';
    case 'background':
      return 'Bakgrundsbild';
    default:
      return 'Redigera';
  }
}

function getDialogDescription(mode: 'pageLabel' | 'terms' | 'notes' | 'background' | null): string {
  switch (mode) {
    case 'pageLabel':
      return 'Ge offertsidan en tydlig rubrik som blir l\u00e4tt att k\u00e4nna igen f\u00f6r kunden.';
    case 'terms':
      return 'H\u00e5ll den juridiska standardtexten samlad h\u00e4r i st\u00e4llet f\u00f6r att ha ett stort textf\u00e4lt i sidpanelen.';
    case 'notes':
      return 'Den h\u00e4r rubriken anv\u00e4nds n\u00e4r offerten inneh\u00e5ller en separat projektnotering.';
    case 'background':
      return 'Ange en bildl\u00e4nk eller rensa bakgrunden f\u00f6r en lugnare sidk\u00e4nsla.';
    default:
      return 'Uppdatera inneh\u00e5ll utan att \u00f6verfylla sidpanelen.';
  }
}

function InspectorDisclosure({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--surface-0)]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{title}</p>
            {badge ? (
              <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        <CaretDown
          size={16}
          weight="bold"
          className={cn('mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="border-t border-[var(--border)] px-3 py-3">{children}</div> : null}
    </section>
  );
}

function EditableSummaryCard({
  label,
  value,
  description,
  actionLabel,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-0)_100%)] px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 break-words text-[13px] font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]"
        >
          <PencilSimpleLine size={12} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
function PresentationPageInspector({ hf }: { hf: HFCtxValue }) {
  const page = hf.pages[hf.activeIdx];

  return (
    <InspectorCard
      title="Sida"
      subtitle="Grundinställningar för presentationssidan."
    >
      <div className="space-y-2">
        <Field label="Sidnamn">
          <input
            type="text"
            value={page.label}
            onChange={(event) => hf.renamePage(hf.activeIdx, event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sidroll">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[12px] text-[var(--text-primary)]">
            {PAGE_ROLE_LABELS[page.role ?? 'custom']}
          </div>
        </Field>

        <ToggleCard
          title="Med i kundens PDF"
          description={page.includeInCustomerPdf === false ? 'Sidan är intern' : 'Sidan följer med kunden'}
          checked={page.includeInCustomerPdf !== false}
          onChange={(checked) => hf.patchActivePage({ includeInCustomerPdf: checked })}
        />

        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            active={(page.kind ?? 'presentation') === 'presentation'}
            onClick={() => hf.patchActivePage({ kind: 'presentation', role: page.role ?? 'custom' })}
          >
            Presentation
          </ChoiceButton>
          <ChoiceButton
            active={(page.kind ?? 'presentation') === 'document'}
            onClick={() => hf.patchActivePage({ kind: 'document', role: 'offer', includeInCustomerPdf: true })}
          >
            Gör till offertsida
          </ChoiceButton>
        </div>
      </div>
    </InspectorCard>
  );
}

function DocumentDefaultsInspector({ hf }: { hf: HFCtxValue }) {
  const fonts = ['Calibri', 'Arial', 'Georgia', 'Helvetica Neue', 'Inter'];

  return (
    <InspectorCard
      title="Dokumentstandard"
      subtitle="Typsnitt och marginaler för presentationssidorna."
    >
      <div className="space-y-2">
        <Field label="Standardteckensnitt">
          <select
            value={hf.docSettings.defaultFont}
            onChange={(event) => hf.patchDocSettings({ defaultFont: event.target.value })}
            className={inputClass}
          >
            {fonts.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </Field>

        <Field label="Sidmarginal">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'tight', label: 'Smal' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Bred' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={hf.docSettings.pageMargin === option.value}
                onClick={() => hf.patchDocSettings({ pageMargin: option.value as 'tight' | 'normal' | 'wide' })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>
      </div>
    </InspectorCard>
  );
}

// Legacy inspector kept temporarily for reference during the new image-panel rollout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyImageInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('image');
  const width = Number(attrs.width ?? 360);
  const heightAttr = attrs.height as number | null | undefined;
  const align = (attrs.align as string | undefined) ?? 'left';
  const position = (attrs.position as string | undefined) ?? 'inline';
  const imgFloat = (attrs.float as string | null | undefined) ?? null;
  const wrapText = (attrs.wrapText as string | undefined) ?? 'none';
  const posX = Number(attrs.posX ?? 0);
  const posY = Number(attrs.posY ?? 0);
  const zIndex = Number(attrs.zIndex ?? 0);
  const altText = (attrs.alt as string | undefined) ?? '';
  const naturalWidth = attrs.naturalWidth as number | null | undefined;
  const naturalHeight = attrs.naturalHeight as number | null | undefined;

  const isFree = position === 'free';
  const isFloating = !isFree && (imgFloat === 'left' || imgFloat === 'right');
  const isBehind = isFree && zIndex < 0;

  const patch = (values: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes('image', values).run();

  function setLayout(mode: 'inline' | 'floatLeft' | 'floatRight' | 'free') {
    if (mode === 'inline') {
      patch({ position: 'inline', float: null, align: 'left', wrapText: 'none' });
    } else if (mode === 'floatLeft') {
      patch({ position: 'inline', float: 'left', align: null });
    } else if (mode === 'floatRight') {
      patch({ position: 'inline', float: 'right', align: null });
    } else {
      patch({ position: 'free', float: null });
    }
  }

  function fillPage() {
    patch({
      position: 'free',
      float: null,
      posX: 0,
      posY: 0,
      width: PRESENTATION_PAGE_WIDTH,
      height: PRESENTATION_PAGE_HEIGHT,
      wrapText: 'none',
      zIndex: -1,
    });
  }

  function resetSize() {
    if (naturalWidth && naturalHeight) {
      const cap = Math.min(naturalWidth, PRESENTATION_PAGE_WIDTH);
      patch({ width: cap, height: null });
    } else {
      patch({ width: 360, height: null });
    }
  }

  function deleteImage() {
    editor.chain().focus().deleteSelection().run();
  }

  return (
    <InspectorCard title="Bild" subtitle="Inställningar för markerad bild.">
      <div className="space-y-2.5">
        <Field label="Layout">
          <div className="grid grid-cols-2 gap-1">
            <ChoiceButton
              active={!isFree && !isFloating}
              onClick={() => setLayout('inline')}
            >
              Infogad
            </ChoiceButton>
            <ChoiceButton
              active={isFree}
              onClick={() => setLayout('free')}
            >
              Fri placering
            </ChoiceButton>
            <ChoiceButton
              active={!isFree && imgFloat === 'left'}
              onClick={() => setLayout('floatLeft')}
            >
              Flytande vä
            </ChoiceButton>
            <ChoiceButton
              active={!isFree && imgFloat === 'right'}
              onClick={() => setLayout('floatRight')}
            >
              Flytande hö
            </ChoiceButton>
          </div>
        </Field>

        {!isFree && !isFloating && (
          <Field label="Justering">
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'left', label: 'Vänster' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Höger' },
              ].map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={align === option.value}
                  onClick={() => patch({ align: option.value })}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        )}

        <Field label={`Bredd  ·  ${width}px`}>
          <input
            type="range"
            min={80}
            max={PRESENTATION_PAGE_WIDTH}
            step={4}
            value={width}
            onChange={(event) => patch({ width: Number(event.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min={80}
              max={PRESENTATION_PAGE_WIDTH}
              step={4}
              value={width}
              onChange={(event) => {
                const next = Math.max(80, Math.min(PRESENTATION_PAGE_WIDTH, Number(event.target.value) || 0));
                patch({ width: next });
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={resetSize}
              className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]"
              title={naturalWidth ? `Återställ till originalstorlek (${naturalWidth}×${naturalHeight}px)` : 'Återställ'}
            >
              Återställ
            </button>
          </div>
        </Field>

        <Field label={`Höjd  ·  ${heightAttr ? `${heightAttr}px` : 'auto'}`}>
          <input
            type="range"
            min={40}
            max={PRESENTATION_PAGE_HEIGHT}
            step={4}
            value={heightAttr ?? 0}
            onChange={(event) => {
              const next = Number(event.target.value);
              patch({ height: next === 0 ? null : next });
            }}
            className="w-full accent-[var(--accent)]"
          />
          <p className="mt-0.5 text-[10px] leading-4 text-[var(--text-muted)]">
            0 = automatisk höjd (proportionell)
          </p>
        </Field>

        {isFree && (
          <>
            <Field label="Position på sidan">
              <div className="grid grid-cols-2 gap-1">
                <label className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-1.5 py-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">X</span>
                  <input
                    type="number"
                    value={Math.round(posX)}
                    onChange={(event) => patch({ posX: Number(event.target.value) || 0 })}
                    className="w-full bg-transparent text-[11px] text-[var(--text-primary)] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-1.5 py-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">Y</span>
                  <input
                    type="number"
                    value={Math.round(posY)}
                    onChange={(event) => patch({ posY: Number(event.target.value) || 0 })}
                    className="w-full bg-transparent text-[11px] text-[var(--text-primary)] focus:outline-none"
                  />
                </label>
              </div>
            </Field>

            <Field label="Textflöde">
              <div className="grid grid-cols-3 gap-1">
                <ChoiceButton active={wrapText === 'none'} onClick={() => patch({ wrapText: 'none' })}>
                  Ovanpå
                </ChoiceButton>
                <ChoiceButton active={wrapText === 'left'} onClick={() => patch({ wrapText: 'left' })}>
                  Vänster
                </ChoiceButton>
                <ChoiceButton active={wrapText === 'right'} onClick={() => patch({ wrapText: 'right' })}>
                  Höger
                </ChoiceButton>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={fillPage}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]"
                title="Fyll hela sidan med bilden som bakgrund"
              >
                Fyll sida
              </button>
              <button
                type="button"
                onClick={() => patch({ zIndex: isBehind ? 1 : -1 })}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                  isBehind
                    ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]'
                )}
                title={isBehind ? 'Bilden ligger bakom texten — klicka för att flytta fram' : 'Lägg bilden bakom texten'}
              >
                {isBehind ? 'Bakom text' : 'Bakom text'}
              </button>
            </div>
          </>
        )}

        <Field label="Alternativtext (alt)">
          <input
            type="text"
            value={altText}
            placeholder="Beskriv bilden för tillgänglighet"
            onChange={(event) => patch({ alt: event.target.value })}
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={deleteImage}
          className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Ta bort bild
        </button>
      </div>
    </InspectorCard>
  );
}

interface ImageStackItem {
  pos: number;
  zIndex: number;
}

function buildForegroundImageStack(editor: Editor): ImageStackItem[] {
  const items: ImageStackItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      items.push({ pos, zIndex: Number(node.attrs.zIndex ?? 0) });
    }
  });
  return items.sort((a, b) => a.zIndex - b.zIndex);
}

function getSelectedImagePosition(editor: Editor): number | null {
  const selection = editor.state.selection as { from?: number; node?: { type?: { name?: string } } };
  return selection.node?.type?.name === 'image' ? (selection.from ?? null) : null;
}

function swapImageLayers(editor: Editor, firstPos: number, secondPos: number) {
  const firstNode = editor.state.doc.nodeAt(firstPos);
  const secondNode = editor.state.doc.nodeAt(secondPos);
  if (!firstNode || !secondNode) return;
  const transaction = editor.state.tr;
  transaction.setNodeAttribute(firstPos, 'zIndex', secondNode.attrs.zIndex ?? 0);
  transaction.setNodeAttribute(secondPos, 'zIndex', firstNode.attrs.zIndex ?? 0);
  editor.view.dispatch(transaction);
}

function getMaxForegroundImageLayer(editor: Editor): number {
  let maxLayer = 0;
  editor.state.doc.descendants((node) => {
    if (
      node.type.name === 'image'
      && node.attrs.position === 'free'
      && node.attrs.background !== true
      && (node.attrs.zIndex ?? 0) >= 0
    ) {
      maxLayer = Math.max(maxLayer, Number(node.attrs.zIndex ?? 0));
    }
  });
  return maxLayer;
}

function ImageInspector({ editor }: { editor: Editor }) {
  const hf = useHeaderFooter();
  const attrs = editor.getAttributes('image') as Record<string, unknown>;
  const position = attrs.position === 'free' ? 'free' : 'inline';
  const floatMode = attrs.float === 'left' || attrs.float === 'right' ? attrs.float : null;
  const align = attrs.align === 'center' || attrs.align === 'right' ? attrs.align : 'left';
  const wrapText = attrs.wrapText === 'left' || attrs.wrapText === 'right' ? attrs.wrapText : 'none';
  const width = typeof attrs.width === 'number' ? attrs.width : null;
  const height = typeof attrs.height === 'number' ? attrs.height : null;
  const naturalWidth = typeof attrs.naturalWidth === 'number' ? attrs.naturalWidth : null;
  const naturalHeight = typeof attrs.naturalHeight === 'number' ? attrs.naturalHeight : null;
  const posX = typeof attrs.posX === 'number' ? attrs.posX : 100;
  const posY = typeof attrs.posY === 'number' ? attrs.posY : 100;
  const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
  const isBackground = attrs.background === true || (position === 'free' && Number(attrs.zIndex ?? 0) < 0);
  const mode: 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background' =
    isBackground
      ? 'background'
      : position === 'free'
        ? 'free'
        : floatMode === 'left'
          ? 'float-left'
          : floatMode === 'right'
            ? 'float-right'
            : width == null && height == null
              ? 'auto'
              : 'inline';

  const [widthDraft, setWidthDraft] = useState(width == null ? '' : String(width));
  const [heightDraft, setHeightDraft] = useState(height == null ? '' : String(height));
  const [posXDraft, setPosXDraft] = useState(String(posX));
  const [posYDraft, setPosYDraft] = useState(String(posY));
  const [altDraft, setAltDraft] = useState(alt);

  useEffect(() => {
    setWidthDraft(width == null ? '' : String(width));
  }, [width]);

  useEffect(() => {
    setHeightDraft(height == null ? '' : String(height));
  }, [height]);

  useEffect(() => {
    setPosXDraft(String(posX));
  }, [posX]);

  useEffect(() => {
    setPosYDraft(String(posY));
  }, [posY]);

  useEffect(() => {
    setAltDraft(alt);
  }, [alt]);

  const syncPageHeight = () => {
    if (!hf) return;
    queueMicrotask(() => {
      syncPresentationPageHeightForActivePage(hf, editor.getJSON() as object | undefined);
    });
  };

  const setImageAttrs = (patch: Record<string, unknown>) => {
    editor.chain().focus().updateAttributes('image', patch).run();
    syncPageHeight();
  };

  const commitPixelField = (
    rawValue: string,
    options: {
      min?: number;
      max?: number;
      allowAuto?: boolean;
      onAuto?: () => void;
      onCommit: (value: number) => void;
    }
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      if (options.allowAuto) options.onAuto?.();
      return;
    }
    const parsed = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(parsed)) return;
    const bounded = Math.round(Math.min(options.max ?? parsed, Math.max(options.min ?? 0, parsed)));
    options.onCommit(bounded);
  };

  const onDraftKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    commit: () => void
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
  };

  const selectMode = (nextMode: 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background') => {
    if (nextMode === 'auto') {
      setImageAttrs({
        position: 'inline',
        float: null,
        align: 'left',
        width: null,
        height: null,
        wrapText: 'none',
        background: false,
      });
      return;
    }

    if (nextMode === 'inline') {
      setImageAttrs({
        position: 'inline',
        float: null,
        align,
        background: false,
        wrapText: 'none',
      });
      return;
    }

    if (nextMode === 'float-left' || nextMode === 'float-right') {
      setImageAttrs({
        position: 'inline',
        float: nextMode === 'float-left' ? 'left' : 'right',
        align: nextMode === 'float-left' ? 'left' : 'right',
        background: false,
        wrapText: 'none',
      });
      return;
    }

    if (nextMode === 'free') {
      setImageAttrs({
        position: 'free',
        float: null,
        background: false,
        wrapText,
        posX,
        posY,
        zIndex: Math.max(1, Number(attrs.zIndex ?? 0), getMaxForegroundImageLayer(editor) + 1),
      });
      return;
    }

    setImageAttrs({
      position: 'free',
      float: null,
      background: true,
      wrapText: 'none',
      posX: 0,
      posY: 0,
      zIndex: 0,
      width: width ?? PRESENTATION_PAGE_WIDTH,
    });
  };

  const layerStack = position === 'free' && !isBackground ? buildForegroundImageStack(editor) : [];
  const selectedLayerPos = getSelectedImagePosition(editor);
  const layerIndex = selectedLayerPos == null ? -1 : layerStack.findIndex((item) => item.pos === selectedLayerPos);
  const canMoveBackward = layerIndex > 0;
  const canMoveForward = layerIndex >= 0 && layerIndex < layerStack.length - 1;

  const applyAutoSize = () => {
    setImageAttrs({ width: null, height: null });
  };

  const fillPage = () => {
    setImageAttrs({
      position: 'free',
      float: null,
      background: false,
      wrapText: 'none',
      posX: 0,
      posY: 0,
      width: PRESENTATION_PAGE_WIDTH,
      height: PRESENTATION_PAGE_HEIGHT,
      zIndex: Math.max(1, getMaxForegroundImageLayer(editor) + 1),
    });
  };

  return (
    <InspectorCard
      title="Bild"
      subtitle="Välj ett tydligt bildläge och finjustera storlek och placering utan tröga sliders."
    >
      <div className="space-y-4">
        <Field label="Bildläge">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'auto', label: 'Auto' },
              { value: 'inline', label: 'Infogad' },
              { value: 'float-left', label: 'Flyt vänster' },
              { value: 'float-right', label: 'Flyt höger' },
              { value: 'free', label: 'Fri placering' },
              { value: 'background', label: 'Bakgrund' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={mode === option.value}
                onClick={() => selectMode(option.value as 'auto' | 'inline' | 'float-left' | 'float-right' | 'free' | 'background')}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        {(mode === 'auto' || mode === 'inline') && (
          <Field label="Justering">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'left', label: 'Vänster' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Höger' },
              ].map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={align === option.value}
                  onClick={() => setImageAttrs({ position: 'inline', float: null, align: option.value, background: false })}
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        )}

        <Field label="Storlek">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton active={width == null && height == null} onClick={applyAutoSize}>
              Auto
            </ChoiceButton>
            <ChoiceButton active={width === 320} onClick={() => setImageAttrs({ width: 320, height: null })}>
              320 px
            </ChoiceButton>
            <ChoiceButton active={width === 520} onClick={() => setImageAttrs({ width: 520, height: null })}>
              520 px
            </ChoiceButton>
            <ChoiceButton active={width === PRESENTATION_PAGE_WIDTH && height == null} onClick={() => setImageAttrs({ width: PRESENTATION_PAGE_WIDTH, height: null })}>
              Full bredd
            </ChoiceButton>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={80}
              max={PRESENTATION_PAGE_WIDTH}
              step={8}
              value={widthDraft}
              onChange={(event) => setWidthDraft(event.target.value)}
              onBlur={() =>
                commitPixelField(widthDraft, {
                  min: 80,
                  max: PRESENTATION_PAGE_WIDTH,
                  allowAuto: true,
                  onAuto: () => setImageAttrs({ width: null }),
                  onCommit: (value) => setImageAttrs({ width: value }),
                })
              }
              onKeyDown={(event) =>
                onDraftKeyDown(event, () =>
                  commitPixelField(widthDraft, {
                    min: 80,
                    max: PRESENTATION_PAGE_WIDTH,
                    allowAuto: true,
                    onAuto: () => setImageAttrs({ width: null }),
                    onCommit: (value) => setImageAttrs({ width: value }),
                  })
                )
              }
              placeholder="Bredd i px"
              className={inputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={4000}
              step={8}
              value={heightDraft}
              onChange={(event) => setHeightDraft(event.target.value)}
              onBlur={() =>
                commitPixelField(heightDraft, {
                  min: 0,
                  max: 4000,
                  allowAuto: true,
                  onAuto: () => setImageAttrs({ height: null }),
                  onCommit: (value) => setImageAttrs({ height: value === 0 ? null : value }),
                })
              }
              onKeyDown={(event) =>
                onDraftKeyDown(event, () =>
                  commitPixelField(heightDraft, {
                    min: 0,
                    max: 4000,
                    allowAuto: true,
                    onAuto: () => setImageAttrs({ height: null }),
                    onCommit: (value) => setImageAttrs({ height: value === 0 ? null : value }),
                  })
                )
              }
              placeholder="Höjd i px"
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Lämna höjden tom för automatisk proportion. Nuvarande original: {naturalWidth ?? 'okänd'} × {naturalHeight ?? 'okänd'} px.
          </p>
        </Field>

        {(mode === 'free' || mode === 'background') && (
          <Field label="Placering på sidan">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="numeric"
                step={8}
                value={posXDraft}
                onChange={(event) => setPosXDraft(event.target.value)}
                onBlur={() =>
                  commitPixelField(posXDraft, {
                    min: 0,
                    max: PRESENTATION_PAGE_WIDTH,
                    onCommit: (value) => setImageAttrs({ posX: value }),
                  })
                }
                onKeyDown={(event) =>
                  onDraftKeyDown(event, () =>
                    commitPixelField(posXDraft, {
                      min: 0,
                      max: PRESENTATION_PAGE_WIDTH,
                      onCommit: (value) => setImageAttrs({ posX: value }),
                    })
                  )
                }
                placeholder="X"
                className={inputClass}
              />
              <input
                type="number"
                inputMode="numeric"
                step={8}
                value={posYDraft}
                onChange={(event) => setPosYDraft(event.target.value)}
                onBlur={() =>
                  commitPixelField(posYDraft, {
                    min: 0,
                    max: Math.max(PRESENTATION_PAGE_HEIGHT * 3, posY),
                    onCommit: (value) => setImageAttrs({ posY: value }),
                  })
                }
                onKeyDown={(event) =>
                  onDraftKeyDown(event, () =>
                    commitPixelField(posYDraft, {
                      min: 0,
                      max: Math.max(PRESENTATION_PAGE_HEIGHT * 3, posY),
                      onCommit: (value) => setImageAttrs({ posY: value }),
                    })
                  )
                }
                placeholder="Y"
                className={inputClass}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ChoiceButton active={posX === 0 && posY === 0} onClick={() => setImageAttrs({ posX: 0, posY: 0 })}>
                Övre vänster
              </ChoiceButton>
              <ChoiceButton active={posX === 96 && posY === 96} onClick={() => setImageAttrs({ posX: 96, posY: 96 })}>
                Textyta
              </ChoiceButton>
              <ChoiceButton active={false} onClick={fillPage}>
                Fyll sida
              </ChoiceButton>
              <ChoiceButton active={false} onClick={applyAutoSize}>
                Auto storlek
              </ChoiceButton>
            </div>
          </Field>
        )}

        {mode === 'free' && (
          <Field label="Textflöde">
            <div className="grid grid-cols-3 gap-2">
              <ChoiceButton active={wrapText === 'none'} onClick={() => setImageAttrs({ wrapText: 'none' })}>
                Ovanpå
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'left'} onClick={() => setImageAttrs({ wrapText: 'left' })}>
                Text höger
              </ChoiceButton>
              <ChoiceButton active={wrapText === 'right'} onClick={() => setImageAttrs({ wrapText: 'right' })}>
                Text vänster
              </ChoiceButton>
            </div>
          </Field>
        )}

        {mode === 'free' && layerStack.length > 1 && (
          <Field label={`Lager (${layerIndex + 1} av ${layerStack.length})`}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!canMoveBackward}
                onClick={() => {
                  if (!canMoveBackward || layerIndex <= 0) return;
                  swapImageLayers(editor, layerStack[layerIndex].pos, layerStack[layerIndex - 1].pos);
                }}
                className={cn(
                  secondaryButtonClass,
                  !canMoveBackward && 'cursor-not-allowed opacity-40'
                )}
              >
                Bakåt
              </button>
              <button
                type="button"
                disabled={!canMoveForward}
                onClick={() => {
                  if (!canMoveForward || layerIndex < 0) return;
                  swapImageLayers(editor, layerStack[layerIndex].pos, layerStack[layerIndex + 1].pos);
                }}
                className={cn(
                  secondaryButtonClass,
                  !canMoveForward && 'cursor-not-allowed opacity-40'
                )}
              >
                Framåt
              </button>
            </div>
          </Field>
        )}

        <Field label="Alternativtext">
          <input
            type="text"
            value={altDraft}
            onChange={(event) => setAltDraft(event.target.value)}
            onBlur={() => setImageAttrs({ alt: altDraft.trim() || null })}
            onKeyDown={(event) => onDraftKeyDown(event, () => setImageAttrs({ alt: altDraft.trim() || null }))}
            placeholder="Beskriv bilden för tillgänglighet"
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
        >
          Ta bort bild
        </button>
      </div>
    </InspectorCard>
  );
}

function TableInspector() {
  return (
    <InspectorCard
      title="Tabell"
      subtitle="Tabeller justeras direkt i dokumentytan. Markera celler och använd den fria layouten på sidan."
    >
      <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-2 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
        Ändra tabellinnehåll direkt i canvasen — markera celler för att redigera.
      </div>
    </InspectorCard>
  );
}

function SignatureInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('signatureBlock');
  const fieldType = (attrs.fieldType as string) ?? 'signature';
  const label = (attrs.label as string) ?? 'Signatur';

  return (
    <InspectorCard title="Signaturfält" subtitle="Avancerat block för presentationssidor.">
      <div className="space-y-2">
        <Field label="Fälttyp">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'signature', label: 'Signatur' },
              { value: 'name', label: 'Namn' },
              { value: 'date', label: 'Datum' },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                active={fieldType === option.value}
                onClick={() => editor.chain().focus().updateAttributes('signatureBlock', { fieldType: option.value }).run()}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="Etikett">
          <input
            type="text"
            value={label}
            onChange={(event) => editor.chain().focus().updateAttributes('signatureBlock', { label: event.target.value }).run()}
            className={inputClass}
          />
        </Field>
      </div>
    </InspectorCard>
  );
}

function VariableInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('variable');
  const key = (attrs.key as string) ?? '';
  const label = (attrs.label as string) ?? '';

  return (
    <InspectorCard title="Variabel" subtitle="Fält som fylls med offertdata automatiskt.">
      <div className="space-y-2">
        <Field label="Variabelnamn">
          <code className="block break-all rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] text-violet-700">
            {`{{${key}}}`}
          </code>
        </Field>
        <Field label="Etikett">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[12px] text-[var(--text-primary)]">
            {label}
          </div>
        </Field>
      </div>
    </InspectorCard>
  );
}

function InspectorCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-2.5 py-1.5">
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">{title}</p>
        {subtitle && <p className="mt-0.5 text-[10px] leading-4 text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      <div className="px-2.5 py-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
        active
          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{description}</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

function StaticCard({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{description}</p>
        </div>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-600">
          {badge}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1">
      <div className="flex items-center justify-between gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--text-primary)]">{label}</span>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors',
        checked ? 'bg-[var(--accent)]' : 'bg-slate-300'
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-3' : 'translate-x-0'
        )}
      />
    </button>
  );
}

const inputClass = 'w-full rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)]';
const textareaClass = `${inputClass} min-h-[72px] resize-y`;
const secondaryButtonClass = 'flex-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]';
