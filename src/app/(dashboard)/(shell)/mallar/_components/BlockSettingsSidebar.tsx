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
import { PRESENTATION_PAGE_HEIGHT, PRESENTATION_PAGE_WIDTH } from './presentation-page-height';
import { cn } from '@shared/lib/utils';

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
        <StructuredOfferInspector hf={hf} />
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

  return (
    <div className="space-y-2 p-2">
      <InspectorCard
        title="Offertsida"
        subtitle="Systemstyrd sida för pris, juridik och summering."
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

          <ToggleCard
            title="Med i kundens PDF"
            description={page.includeInCustomerPdf === false ? 'Dold för kunden' : 'Visas i offerten'}
            checked={page.includeInCustomerPdf !== false}
            onChange={(checked) => hf.patchActivePage({ includeInCustomerPdf: checked })}
          />
          <StaticCard
            title="Sidmodell"
            description="Strukturerad offert"
            badge="System"
          />
        </div>
      </InspectorCard>

      <InspectorCard
        title="Layout"
        subtitle="Summering och fri textyta."
      >
        <div className="space-y-2">
          <Field label="Summering">
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton
                active={(document.summaryPlacement ?? 'right') === 'right'}
                onClick={() => hf.patchActivePage({ document: { ...document, summaryPlacement: 'right' } })}
              >
                Till höger
              </ChoiceButton>
              <ChoiceButton
                active={(document.summaryPlacement ?? 'right') === 'below'}
                onClick={() => hf.patchActivePage({ document: { ...document, summaryPlacement: 'below' } })}
              >
                Under prisdel
              </ChoiceButton>
            </div>
          </Field>

          <Field label="Fri textyta">
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
      </InspectorCard>

      <InspectorCard
        title="Innehåll"
        subtitle="Block som visas på offertsidan."
      >
        <div className="space-y-1">
          <ToggleRow label="Logo" checked={document.showLogo ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showLogo: checked } })} />
          <ToggleRow label="Avsändare" checked={document.showSenderDetails ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showSenderDetails: checked } })} />
          <ToggleRow label="Kundblock" checked={document.showCustomerBlock ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showCustomerBlock: checked } })} />
          <ToggleRow label="Fri textyta" checked={document.showIntro ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showIntro: checked } })} />
          <ToggleRow label="Prisdel" checked={document.showLineItems ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showLineItems: checked } })} />
          <ToggleRow label="Summering" checked={document.showSummary ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showSummary: checked } })} />
          <ToggleRow label="Juridik" checked={document.showTerms ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showTerms: checked } })} />
          <ToggleRow label="Anteckningar" checked={document.showNotes ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showNotes: checked } })} />
          <ToggleRow label="Footer" checked={document.showFooter ?? true} onChange={(checked) => hf.patchActivePage({ document: { ...document, showFooter: checked } })} />
        </div>
      </InspectorCard>

      <InspectorCard
        title="Branding & bakgrund"
        subtitle="Watermark och visuell identitet."
      >
        <div className="space-y-2">
          <Field label="Bakgrund / watermark">
            <input
              type="text"
              value={document.backgroundImageSrc ?? ''}
              onChange={(event) => hf.patchActivePage({ document: { ...document, backgroundImageSrc: event.target.value } })}
              placeholder="Klistra in bild-URL eller ladda upp en bakgrund"
              className={inputClass}
            />
          </Field>

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

          <Field label="Bakgrundsstyrka">
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
      </InspectorCard>

      <InspectorCard
        title="Juridik & texter"
        subtitle="Standardtexter som används i offerten."
      >
        <div className="space-y-2">
          <Field label="Rubrik för juridik">
            <input
              type="text"
              value={document.termsHeading ?? DEFAULT_DOCUMENT_TERMS_HEADING}
              onChange={(event) => hf.patchActivePage({ document: { ...document, termsHeading: event.target.value } })}
              className={inputClass}
            />
          </Field>

          <Field label="Juridisk standardtext">
            <textarea
              rows={6}
              value={document.termsBody ?? DEFAULT_DOCUMENT_TERMS_BODY}
              onChange={(event) => hf.patchActivePage({ document: { ...document, termsBody: event.target.value } })}
              className={textareaClass}
            />
          </Field>

          <Field label="Rubrik för offertspecifik anteckning">
            <input
              type="text"
              value={document.notesHeading ?? DEFAULT_DOCUMENT_NOTES_HEADING}
              onChange={(event) => hf.patchActivePage({ document: { ...document, notesHeading: event.target.value } })}
              className={inputClass}
            />
          </Field>
        </div>
      </InspectorCard>
    </div>
  );
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

function ImageInspector({ editor }: { editor: Editor }) {
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
