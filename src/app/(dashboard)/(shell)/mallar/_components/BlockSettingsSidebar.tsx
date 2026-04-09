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
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-2 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
              Summeringen visas alltid som en smal box under prisdelen och ovanför juridiska villkor.
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
