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
      <aside className="hidden w-[244px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex" />
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
    <aside className="hidden w-[244px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <section className="mb-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                <NotePencil size={18} weight="duotone" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {isDocumentPage ? 'Offertsida' : 'Byggstenar'}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {isDocumentPage
                    ? 'Den här sidan styrs av fasta offertblock. Lägg din energi på innehåll och inställningar i stället för manuell layout.'
                    : 'Snabbt innehåll för presentationssidor. Håll byggandet enkelt och låt sidan bära budskapet.'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            {isDocumentPage ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Systemstyrd offert</p>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                  Prisrad, summering, kundblock och godkännande byggs automatiskt. Anpassa istället rubriker,
                  juridik, bakgrund och hur mycket plats den fria offerttexten ska ta.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Snabbsektioner</p>
                  <div className="grid gap-2">
                    {quickSections.map((preset) => (
                      <InsertButton
                        key={preset.key}
                        icon={preset.icon}
                        label={preset.label}
                        description={preset.tooltip}
                        onClick={() => editor.chain().focus().insertContent(preset.nodes as never).run()}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Grundblock</p>
                  <div className="grid gap-2">
                    <InsertButton icon={<TextHOne size={15} />} label="Rubrik 1" description="Tydlig huvudrubrik för sidan." onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                    <InsertButton icon={<TextHTwo size={15} />} label="Rubrik 2" description="Sektionstitel eller underrubrik." onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                    <InsertButton icon={<TextT size={15} />} label="Brödtext" description="Vanligt textstycke." onClick={() => editor.chain().focus().setParagraph().run()} />
                    <InsertButton icon={<ListBullets size={15} />} label="Punktlista" description="Samla leveranser eller nyckelpunkter." onClick={() => editor.chain().focus().toggleBulletList().run()} />
                    <InsertButton icon={<Table size={15} />} label="Tabell" description="För jämförelser eller bilagor." onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
                    <InsertButton icon={<PhMinus size={15} />} label="Avdelare" description="Skapa luft mellan sektioner." onClick={() => editor.chain().focus().setHorizontalRule().run()} />
                    <InsertButton icon={<PhImage size={15} />} label="Bild" description="Lägg till en bild eller illustration." onClick={() => fileRef.current?.click()} />
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
          </div>
        </section>

        <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Avancerat</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Variabler och manuella signaturfält för specialfall och äldre fria mallar.</p>
            </div>
            <span className={cn('text-[var(--text-muted)] transition-transform', advancedOpen ? 'rotate-180' : '')}>
              <ArrowDown size={14} />
            </span>
          </button>

          {advancedOpen && (
            <div className="border-t border-[var(--border)] px-4 py-3">
              {isDocumentPage ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-3 py-4 text-xs leading-6 text-[var(--text-secondary)]">
                  Offertsidan använder redan systemets pris-, summerings- och godkännandeblock.
                  Använd variabler och signaturfält på presentationssidor eller i äldre specialmallar.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Variabler</p>
                    {OFFER_PLACEHOLDERS
                      .filter((placeholder) => placeholder.key !== '{{lineItems}}' && placeholder.key !== '{{signature}}')
                      .map((placeholder) => (
                        <InsertButton
                          key={placeholder.key}
                          icon={<BracketsCurly size={15} />}
                          label={placeholder.label}
                          description={placeholder.key}
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

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Signaturfält</p>
                    <InsertButton icon={<PenNib size={15} />} label="Signaturfält" description="Manuellt signaturblock för specialmallar." onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'signature', label: 'Signatur' } }).run()} />
                    <InsertButton icon={<User size={15} />} label="Namnfält" description="Fält för fullständigt namn." onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'name', label: 'Fullständigt namn' } }).run()} />
                    <InsertButton icon={<CalendarBlank size={15} />} label="Datumfält" description="Fält för signeringsdatum." onClick={() => editor.chain().focus().insertContent({ type: 'signatureBlock', attrs: { fieldType: 'date', label: 'Signeringsdatum' } }).run()} />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}

function InsertButton({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)]"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </button>
  );
}
