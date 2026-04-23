'use client';

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { DocumentDefaultsInspector, PresentationPageInspector } from './presentation-page-inspectors';
import { ImageInspector } from './image-inspector';
import { StructuredOfferInspector } from './structured-offer-inspector';
import {
  ChoiceButton,
  Field,
  InspectorCard,
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
