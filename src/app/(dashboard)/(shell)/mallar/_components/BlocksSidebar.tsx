'use client';

import { useRef } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { uploadTemplateImage } from './template-image-upload';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  BracketsCurly,
  CalendarBlank,
  Image as PhImage,
  ListBullets,
  Minus as PhMinus,
  PenNib,
  Table,
  TextHOne,
  TextHTwo,
  TextT,
  User,
} from '@phosphor-icons/react';

function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

const VISIBLE_VARIABLES = OFFER_PLACEHOLDERS.filter(
  (p) => p.key !== '{{lineItems}}' && p.key !== '{{signature}}',
);

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const fileRef = useRef<HTMLInputElement>(null);

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';
  const isAppendixPage = activePage?.role === 'appendix' && !isDocumentPage;
  const isPageReady = hf?.activePageReady ?? true;

  if (!editor || !hf) {
    return (
      <aside className="hidden w-[212px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex" />
    );
  }

  async function insertImage(file: File) {
    const currentEditor = editor;
    if (!currentEditor) return;
    if (!hf?.activePageReady) {
      window.alert('Vänta ett ögonblick tills sidan är färdigladdad innan du lägger in bilden.');
      return;
    }
    try {
      const src = await uploadTemplateImage(file);
      insertTemplateImageIntoEditor(currentEditor, src);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bilden.');
    }
  }

  return (
    <aside className="hidden w-[212px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex">
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Byggstenar
        </p>
        <p className="mb-3 px-1 text-[10px] leading-4 text-[var(--text-muted)]">
          Klicka för att infoga i sidan. Sidor hanteras i raden längst ner ↓
        </p>

        {isDocumentPage ? (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
            Den här sidan är systemstyrd. Justera innehåll, juridik och layout i panelen till höger.
          </div>
        ) : (
          <div className="space-y-3">
            {!isPageReady && (
              <div className="rounded-md border border-dashed border-[var(--accent-border)] bg-[var(--accent-subtle)] px-2.5 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
                Laddar rätt sida i editorn. Vänta en halv sekund innan du lägger in bild eller text.
              </div>
            )}

            {isAppendixPage && (
              <Section
                title="Bildbilaga"
                hint="Bilagor startar tomma med flit. Lägg in en eller flera bilder här i stället för att börja med en rubrik."
              >
                <InsertButton
                  icon={<PhImage size={13} />}
                  label="Ladda upp första bilden"
                  onClick={() => fileRef.current?.click()}
                  disabled={!isPageReady}
                />
              </Section>
            )}

            <Section title="Textblock">
              <InsertButton icon={<TextHOne size={13} />} label="Rubrik 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={!isPageReady} />
              <InsertButton icon={<TextHTwo size={13} />} label="Rubrik 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!isPageReady} />
              <InsertButton icon={<TextT size={13} />} label="Brödtext" onClick={() => editor.chain().focus().setParagraph().run()} disabled={!isPageReady} />
              <InsertButton icon={<ListBullets size={13} />} label="Punktlista" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!isPageReady} />
            </Section>

            <Section title="Media & struktur">
              <InsertButton icon={<PhImage size={13} />} label={isAppendixPage ? 'Lägg till bild till bilagan' : 'Bild'} onClick={() => fileRef.current?.click()} disabled={!isPageReady} />
              <InsertButton icon={<Table size={13} />} label="Tabell" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={!isPageReady} />
              <InsertButton icon={<PhMinus size={13} />} label="Avdelare" onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={!isPageReady} />
            </Section>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void insertImage(file);
                event.target.value = '';
              }}
            />

            <Section
              title="Kunduppgifter"
              hint="Fält som fylls automatiskt från offerten."
            >
              {VISIBLE_VARIABLES.map((placeholder) => (
                <VariableButton
                  key={placeholder.key}
                  label={placeholder.label}
                  tokenKey={placeholder.key}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: 'variable',
                        attrs: { key: toKey(placeholder.key), label: placeholder.label },
                      })
                      .run()
                  }
                  disabled={!isPageReady}
                />
              ))}
            </Section>

            <Section
              title="Signatur"
              hint="Underskriftsfält för kunden."
            >
              <InsertButton
                icon={<PenNib size={13} />}
                label="Signatur"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } })
                    .run()
                }
                disabled={!isPageReady}
              />
              <InsertButton
                icon={<User size={13} />}
                label="Namn"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } })
                    .run()
                }
                disabled={!isPageReady}
              />
              <InsertButton
                icon={<CalendarBlank size={13} />}
                label="Datum"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Signeringsdatum' } })
                    .run()
                }
                disabled={!isPageReady}
              />
            </Section>
          </div>
        )}
      </div>
    </aside>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {title}
      </p>
      {hint && (
        <p className="mb-1 px-1 text-[10px] leading-4 text-[var(--text-muted)]">{hint}</p>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function InsertButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--surface-2)] text-[var(--accent)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--text-primary)]">{label}</span>
    </button>
  );
}

function VariableButton({
  label,
  tokenKey,
  onClick,
  disabled = false,
}: {
  label: string;
  tokenKey: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Infogar ${tokenKey}`}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-50 text-violet-600">
        <BracketsCurly size={12} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="truncate font-mono text-[9px] text-[var(--text-muted)]">{tokenKey}</span>
      </span>
    </button>
  );
}
