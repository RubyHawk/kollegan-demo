'use client';

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { DocumentDefaultsInspector, PresentationPageInspector } from './presentation-page-inspectors';
import { ImageInspector } from './image-inspector';
import { StructuredOfferInspector } from './structured-offer-inspector';
import { PAGE_ROLE_LABELS } from './template-doc';
import {
  ChoiceButton,
  Field,
  InspectorCard,
  SegmentedControl,
  inputClass,
} from './block-settings-controls';

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
    <aside className="hidden min-h-0 shrink-0 flex-col border-l border-[var(--ui-border)] bg-[var(--ui-surface-raised)] xl:flex xl:w-[clamp(300px,24vw,400px)]">
      <InspectorHeader
        title={activePage?.label ?? 'Sida'}
        meta={isDocumentPage ? 'Strukturerad offertsida' : PAGE_ROLE_LABELS[activePage?.role ?? 'custom']}
        pdfLabel={activePage?.includeInCustomerPdf === false ? 'Intern' : 'Kund + PDF'}
      />
      {isDocumentPage ? (
        <StructuredOfferInspector key={activePage?.id ?? 'document-page'} hf={hf} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
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

function InspectorHeader({ title, meta, pdfLabel }: { title: string; meta: string; pdfLabel: string }) {
  return (
    <div className="shrink-0 border-b border-l-4 border-b-[var(--ui-border)] border-l-[var(--ui-accent)] bg-[var(--ui-surface)] px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">Inspektor</p>
        <span className="rounded bg-[var(--ui-surface-selected)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--ui-accent)]">
          {pdfLabel}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--ui-text)]">{title}</p>
          <p className="mt-1 truncate text-[12px] text-[var(--ui-text-secondary)]">{meta}</p>
        </div>
      </div>
    </div>
  );
}

function TableInspector() {
  return (
    <InspectorCard
      title="Tabell"
      subtitle="Tabeller justeras direkt i dokumentytan. Markera celler och använd den fria layouten på sidan."
    >
      <div className="border-l-2 border-[var(--ui-border)] px-3 py-1.5 text-[12px] leading-5 text-[var(--ui-text-secondary)]">
        Ändra tabellinnehåll direkt i canvasen - markera celler för att redigera.
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
          <SegmentedControl columns={3}>
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
          </SegmentedControl>
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
          <code className="block break-all rounded-md bg-[var(--ui-surface-selected)] px-3 py-2 text-[12px] font-medium text-[var(--ui-accent)]">
            {`{{${key}}}`}
          </code>
        </Field>
        <Field label="Etikett">
          <div className="rounded-md bg-[var(--ui-surface-hover)] px-3 py-2 text-[13px] font-medium text-[var(--ui-text)]">
            {label}
          </div>
        </Field>
      </div>
    </InspectorCard>
  );
}
