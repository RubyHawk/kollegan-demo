'use client';

import { useMemo, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { uploadTemplateImage } from './template-image-upload';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  ArrowDown,
  BracketsCurly,
  CalendarBlank,
  Image as PhImage,
  ListBullets,
  Minus as PhMinus,
  NotePencil,
  PenNib,
  Signature,
  Table,
  TextHOne,
  TextHTwo,
  TextT,
  User,
} from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import { SECTION_PRESETS } from './section-presets';

function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';

  const quickSections = useMemo(
    () => SECTION_PRESETS.filter((preset) => ['introSection', 'offerHeader', 'pricingSection', 'termsSection'].includes(preset.key)),
    [],
  );

  if (!editor || !hf) {
    return (
      <aside className="hidden w-[212px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex" />
    );
  }

  async function insertImage(file: File) {
    const currentEditor = editor;
    if (!currentEditor) return;
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
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <NotePencil size={13} className="text-[var(--accent)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {isDocumentPage ? 'Offertsida' : 'Byggstenar'}
          </p>
        </div>

        {isDocumentPage ? (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-2.5 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
            Den här sidan styrs automatiskt. Anpassa rubriker, juridik, bakgrund och layout i högerspalten.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Snabbsektioner</p>
              <div className="flex flex-col gap-1">
                {quickSections.map((preset) => (
                  <InsertButton
                    key={preset.key}
                    icon={preset.icon}
                    label={preset.label}
                    onClick={() => editor.chain().focus().insertContent(preset.nodes as never).run()}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Grundblock</p>
              <div className="flex flex-col gap-1">
                <InsertButton icon={<TextHOne size={13} />} label="Rubrik 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                <InsertButton icon={<TextHTwo size={13} />} label="Rubrik 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                <InsertButton icon={<TextT size={13} />} label="Brödtext" onClick={() => editor.chain().focus().setParagraph().run()} />
                <InsertButton icon={<ListBullets size={13} />} label="Punktlista" onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <InsertButton icon={<Table size={13} />} label="Tabell" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
                <InsertButton icon={<PhMinus size={13} />} label="Avdelare" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
                <InsertButton icon={<PhImage size={13} />} label="Bild" onClick={() => fileRef.current?.click()} />
              </div>
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
            </div>
          </div>
        )}

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-active)]"
          >
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">Avancerat</p>
            <span className={cn('text-[var(--text-muted)] transition-transform', advancedOpen ? 'rotate-180' : '')}>
              <ArrowDown size={12} />
            </span>
          </button>

          {advancedOpen && (
            <div className="mt-1 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1.5">
              {isDocumentPage ? (
                <p className="px-1 py-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                  Använd variabler och signaturfält på presentationssidor.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Variabler</p>
                    {OFFER_PLACEHOLDERS
                      .filter((placeholder) => placeholder.key !== '{{lineItems}}' && placeholder.key !== '{{signature}}')
                      .map((placeholder) => (
                        <InsertButton
                          key={placeholder.key}
                          icon={<BracketsCurly size={13} />}
                          label={placeholder.label}
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .insertContent({ type: 'variable', attrs: { key: toKey(placeholder.key), label: placeholder.label } })
                              .run()
                          }
                        />
                      ))}
                  </div>

                  <div className="space-y-1">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Signaturfält</p>
                    <InsertButton icon={<PenNib size={13} />} label="Signatur" onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } }).run()} />
                    <InsertButton icon={<User size={13} />} label="Namn" onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } }).run()} />
                    <InsertButton icon={<CalendarBlank size={13} />} label="Datum" onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Signeringsdatum' } }).run()} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function InsertButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--surface-2)] text-[var(--accent)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--text-primary)]">{label}</span>
    </button>
  );
}
