'use client';

import { useRef, useState } from 'react';
import type { HFCtxValue } from './header-footer-context';
import { DEFAULT_DOCUMENT_NOTES_HEADING, DEFAULT_DOCUMENT_TERMS_BODY, DEFAULT_DOCUMENT_TERMS_HEADING } from './template-doc';
import { uploadTemplateImage } from './template-image-upload';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, ModalActionFooter, ModalBody } from '@shared/ui/dialog';
import { ChoiceButton, EditableSummaryCard, Field, InspectorDisclosure, SegmentedControl, StaticCard, ToggleCard, ToggleRow, inputClass, secondaryButtonClass, textareaClass, truncateText } from './block-settings-controls';

export function StructuredOfferInspector({ hf }: { hf: HFCtxValue }) {
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <InspectorDisclosure
          title={'Sidans grund'}
          subtitle={'Rubrik, PDF-status och låst offertmodell.'}
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
          title="Läsbarhet"
          subtitle={'Rytm, summering och fri textyta.'}
          badge={document.introLayout === 'roomy' ? 'Rymlig' : 'Kompakt'}
        >
          <div className="space-y-2">
            <Field label="Summering">
              <div className="border-l-2 border-[var(--ui-border)] px-3 py-1.5 text-[12px] leading-5 text-[var(--ui-text-secondary)]">
                {'Summeringen visas alltid som en smal box under produkter och tj\u00e4nster, precis innan juridiska villkor.'}
              </div>
            </Field>

            <Field label={'Fri textyta'}>
              <SegmentedControl>
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
              </SegmentedControl>
            </Field>
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title={'Kundvyns delar'}
          subtitle={'Vilka systemblock som visas.'}
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
          title="Visuell bakgrund"
          subtitle={'Bild, styrka och placering.'}
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
                className="w-full accent-[var(--ui-accent)]"
              />
            </Field>

            <Field label="Placering">
              <SegmentedControl columns={3}>
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
              </SegmentedControl>
            </Field>
          </div>
        </InspectorDisclosure>

        <InspectorDisclosure
          title={'Standardtexter'}
          subtitle={'Juridik och anteckningsrubrik.'}
          badge="Dialog"
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

            <div className="border-l-2 border-[var(--ui-accent)] bg-[var(--ui-surface-selected)] px-3 py-2">
              <p className="text-[12px] font-semibold text-[var(--ui-text)]">{'Fri offerttext skrivs direkt i canvasen'}</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--ui-text-secondary)]">
                {'Den stora introytan p\u00e5 sidan \u00e4r markerad som skrivbar, s\u00e5 du slipper fler textf\u00e4lt i panelen.'}
              </p>
            </div>
          </div>
        </InspectorDisclosure>
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent mobileVariant="sheet" size="md" showMobileClose>
          <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[var(--ui-border)] pr-16">
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
                <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2.5 text-[12px] leading-5 text-[var(--ui-text-secondary)]">
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
              className="rounded-md border border-[var(--ui-accent)] bg-[var(--ui-accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ui-text-inverse)] transition-colors hover:border-[var(--ui-accent-hover)] hover:bg-[var(--ui-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
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
