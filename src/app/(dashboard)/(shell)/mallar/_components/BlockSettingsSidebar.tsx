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
import { cn } from '@shared/lib/utils';
import { ArrowDown, CaretDoubleRight } from '@phosphor-icons/react';

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
    <aside className="hidden w-[320px] shrink-0 xl:flex flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface-1)]">
      {isDocumentPage ? (
        <StructuredOfferInspector hf={hf} />
      ) : (
        <div className="space-y-3 p-3">
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
    <div className="space-y-3 p-3">
      <InspectorCard
        title="Offertsida"
        subtitle="Den här sidan styr offertens struktur, juridik, summering och helhetslayout."
      >
        <div className="space-y-3">
          <Field label="Sidnamn">
            <input
              type="text"
              value={page.label}
              onChange={(event) => hf.renamePage(hf.activeIdx, event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <ToggleCard
              title="Med i kundens PDF"
              description={page.includeInCustomerPdf === false ? 'Dold för kunden' : 'Visas i den slutliga offerten'}
              checked={page.includeInCustomerPdf !== false}
              onChange={(checked) => hf.patchActivePage({ includeInCustomerPdf: checked })}
            />
            <StaticCard
              title="Sidmodell"
              description="Strukturerad offert"
              badge="System"
            />
          </div>
        </div>
      </InspectorCard>

      <InspectorCard
        title="Layout"
        subtitle="Styr hur kundblock, summering och fri textyta placeras."
      >
        <div className="space-y-3">
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
        subtitle="Välj vilka fasta block som ska finnas med på offertsidan."
      >
        <div className="grid grid-cols-2 gap-2">
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
        subtitle="Styr watermark och visuell identitet på offertsidan."
      >
        <div className="space-y-3">
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
        subtitle="Här styr du standardtexterna som används i den färdiga offerten."
      >
        <div className="space-y-3">
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
      <div className="space-y-3">
        <Field label="Sidnamn">
          <input
            type="text"
            value={page.label}
            onChange={(event) => hf.renamePage(hf.activeIdx, event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sidroll">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
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
      subtitle="Gemensamma inställningar för presentationssidornas textyta."
    >
      <div className="space-y-3">
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
  const align = (attrs.align as string | undefined) ?? 'left';

  return (
    <InspectorCard
      title="Bild"
      subtitle="Grundläggande inställningar för den markerade bilden."
    >
      <div className="space-y-3">
        <Field label="Bredd">
          <input
            type="range"
            min={120}
            max={816}
            step={8}
            value={width}
            onChange={(event) => editor.chain().focus().updateAttributes('image', { width: Number(event.target.value) }).run()}
            className="w-full accent-[var(--accent)]"
          />
          <p className="mt-2 text-right text-xs text-[var(--text-muted)]">{width}px</p>
        </Field>

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
                onClick={() => editor.chain().focus().updateAttributes('image', { align: option.value, position: 'inline' }).run()}
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

function TableInspector() {
  return (
    <InspectorCard
      title="Tabell"
      subtitle="Tabeller justeras direkt i dokumentytan. Markera celler och använd den fria layouten på sidan."
    >
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-3 py-4 text-xs leading-6 text-[var(--text-secondary)]">
        Den här editorn är nu mindre Word-lik. För tabeller räcker det i regel att ändra innehållet direkt i canvasen.
      </div>
    </InspectorCard>
  );
}

function SignatureInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('signatureBlock');
  const fieldType = (attrs.fieldType as string) ?? 'signature';
  const label = (attrs.label as string) ?? 'Signatur';

  return (
    <InspectorCard title="Signaturfält" subtitle="Avancerat block för specialmallar och fria presentationssidor.">
      <div className="space-y-3">
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
    <InspectorCard title="Variabel" subtitle="Avancerat fält som fylls med offertdata automatiskt.">
      <div className="space-y-3">
        <Field label="Variabelnamn">
          <code className="block break-all rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
            {`{{${key}}}`}
          </code>
        </Field>
        <Field label="Etikett">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
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
    <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {subtitle && <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      <div className="px-4 py-4">{children}</div>
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
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
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
        'rounded-2xl border px-3 py-2 text-sm font-medium transition-colors',
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
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
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
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
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
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
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
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
      )}
      aria-pressed={checked}
    >
      <span className={cn(
        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}

const inputClass = 'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)]';
const textareaClass = `${inputClass} min-h-[120px] resize-y`;
const secondaryButtonClass = 'flex-1 rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]';
