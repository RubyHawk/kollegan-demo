'use client';

import { useMemo, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import { uploadTemplateImage } from './template-image-upload';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  ArrowDown,
  ArrowUp,
  BracketsCurly,
  CalendarBlank,
  ChatText,
  ClipboardText,
  File,
  FileArrowUp,
  FileText,
  Image as PhImage,
  ListBullets,
  Minus as PhMinus,
  NotePencil,
  PenNib,
  Plus,
  Quotes,
  Signature,
  SquaresFour,
  Table,
  TextHOne,
  TextHTwo,
  TextT,
  Trash,
  User,
} from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';
import { SECTION_PRESETS } from './section-presets';
import { PAGE_ROLE_LABELS, type PageDoc, type PageRole } from './template-doc';

type TipTapNode = Record<string, unknown>;

type PageBlueprint = {
  key: string;
  label: string;
  role: PageRole;
  kind: 'presentation' | 'document';
  description: string;
  icon: React.ReactNode;
  body: { type: 'doc'; content: TipTapNode[] };
};

const PAGE_BLUEPRINTS: PageBlueprint[] = [
  {
    key: 'cover',
    label: 'Omslag',
    role: 'cover',
    kind: 'presentation',
    description: 'Första sidan med stark rubrik, företag och sammanhang.',
    icon: <File size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Sätt tonen direkt' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Använd omslaget för ett starkt första intryck, en tydlig titel och en kort kontext om offerten.' }],
        },
      ],
    },
  },
  {
    key: 'introduction',
    label: 'Introduktion',
    role: 'introduction',
    kind: 'presentation',
    description: 'Kort värdeerbjudande eller inledning till kunden.',
    icon: <ChatText size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Introduktion' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Sammanfatta vad kunden får, varför lösningen passar och vilket nästa steg du vill leda dem till.' }],
        },
      ],
    },
  },
  {
    key: 'offer',
    label: 'Offertsida',
    role: 'offer',
    kind: 'document',
    description: 'Strukturerad offert med pris, summering, juridik och tydlig layout.',
    icon: <NotePencil size={16} />,
    body: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Här kan du skriva en kort introduktion, extra förtydliganden eller offertspecifika anteckningar.' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Prisdel, summering och godkännande byggs automatiskt av systemet.' }],
        },
      ],
    },
  },
  {
    key: 'scope',
    label: 'Scope',
    role: 'scope',
    kind: 'presentation',
    description: 'Vad som ingår i leveransen och hur arbetet är avgränsat.',
    icon: <ClipboardText size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Leverans & omfattning' }] },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverans 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Leverans 2' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Avgränsning eller ansvarspunkt' }] }] },
          ],
        },
      ],
    },
  },
  {
    key: 'references',
    label: 'Referenser',
    role: 'references',
    kind: 'presentation',
    description: 'Referenskunder, case eller social proof.',
    icon: <Quotes size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Referenser' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Lägg till kundcitat, case eller konkreta resultat som bygger förtroende.' }],
        },
      ],
    },
  },
  {
    key: 'terms',
    label: 'Villkor',
    role: 'terms',
    kind: 'presentation',
    description: 'Extra villkor eller policyer som ska ligga utanför offertsidan.',
    icon: <Signature size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Villkor' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Använd den här sidan för längre villkor, bilagor eller policytexter som inte hör hemma i själva offertsidan.' }],
        },
      ],
    },
  },
  {
    key: 'appendix',
    label: 'Bilaga',
    role: 'appendix',
    kind: 'presentation',
    description: 'Fristående avslutande sida för tabeller, visualiseringar eller bilagor.',
    icon: <FileArrowUp size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bilaga' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Fyll sidan med kompletterande material som ska följa med kunden men inte störa huvudflödet.' }],
        },
      ],
    },
  },
];

function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

function getPageBadge(page: PageDoc) {
  if (page.kind === 'document') return 'Offertsida';
  return PAGE_ROLE_LABELS[page.role ?? 'custom'];
}

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';

  const quickSections = useMemo(
    () => SECTION_PRESETS.filter((preset) => ['introSection', 'offerHeader', 'pricingSection', 'termsSection'].includes(preset.key)),
    [],
  );

  if (!editor || !hf) {
    return (
      <aside className="hidden w-[292px] shrink-0 border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex" />
    );
  }

  const context = hf;

  async function insertImage(file: File) {
    if (!editor) return;
    try {
      const src = await uploadTemplateImage(file);
      insertTemplateImageIntoEditor(editor, src);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bilden.');
    }
  }

  function addPage(blueprint: PageBlueprint) {
    context.addPage({
      label: blueprint.label,
      role: blueprint.role,
      kind: blueprint.kind,
      includeInCustomerPdf: blueprint.kind === 'document' || blueprint.role === 'cover' || blueprint.role === 'appendix',
      body: blueprint.body,
    });
    setShowBlueprints(false);
  }

  return (
    <aside className="hidden w-[292px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] xl:flex">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
            <SquaresFour size={18} weight="duotone" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Mallflöde</p>
            <p className="text-xs leading-5 text-[var(--text-muted)]">Bygg ordning, sidor och innehåll med en tydligare struktur.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarCard
          title="Sidor"
          subtitle="Byt ordning, namn och sidtyp här. Offertsidan är en särskild sidmodell."
          action={(
            <button
              type="button"
              onClick={() => setShowBlueprints((value) => !value)}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={12} weight="bold" />
              Lägg till sida
            </button>
          )}
        >
          <div className="space-y-2">
            {context.pages.map((page, index) => (
              <PageRow
                key={page.id}
                page={page}
                active={index === context.activeIdx}
                index={index}
                total={context.pages.length}
                onActivate={() => context.switchPage(index)}
                onMoveUp={index > 0 ? () => context.movePage(index, index - 1) : undefined}
                onMoveDown={index < context.pages.length - 1 ? () => context.movePage(index, index + 1) : undefined}
                onDelete={context.pages.length > 1 ? () => context.removePage(index) : undefined}
              />
            ))}
          </div>

          {showBlueprints && (
            <div className="mt-3 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Sidtyper</p>
              <div className="grid gap-2">
                {PAGE_BLUEPRINTS.map((blueprint) => (
                  <button
                    key={blueprint.key}
                    type="button"
                    onClick={() => addPage(blueprint)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)]"
                  >
                    <div className="mb-2 flex items-center gap-2 text-[var(--text-primary)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
                        {blueprint.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{blueprint.label}</p>
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          {blueprint.kind === 'document' ? 'Strukturerad sida' : 'Presentationssida'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs leading-5 text-[var(--text-secondary)]">{blueprint.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SidebarCard>

        <SidebarCard
          title={isDocumentPage ? 'Offertsida' : 'Innehåll'}
          subtitle={isDocumentPage
            ? 'Pris, summering och signering är låsta systemblock. Redigera bara den fria texten och styr resten i högerspalten.'
            : 'Snabbinnehåll för presentationssidor. Håll formatet enkelt och bygg sida för sida.'}
        >
          {isDocumentPage ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-0)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Strukturerad offertlayout</p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                Kundblock, metadata, radartiklar, summering och footer genereras av systemet.
                Det gör att offerten blir tydlig, konsekvent och lättare att hålla professionell.
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
        </SidebarCard>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Avancerat</p>
              <p className="text-xs leading-5 text-[var(--text-muted)]">Variabler och signaturfält för specialfall och äldre fria sidor.</p>
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
        </div>
      </div>
    </aside>
  );
}

function SidebarCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
            {subtitle && <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function PageRow({
  page,
  active,
  index,
  total,
  onActivate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  page: PageDoc;
  active: boolean;
  index: number;
  total: number;
  onActivate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-3 transition-colors',
        active
          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-active)]'
      )}
    >
      <button type="button" onClick={onActivate} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{page.label}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                page.kind === 'document'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {getPageBadge(page)}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {page.includeInCustomerPdf === false ? 'Intern sida' : 'Med i PDF'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-medium text-[var(--text-muted)]">{index + 1}/{total}</span>
        </div>
      </button>

      <div className="mt-3 flex items-center gap-1">
        <IconAction label="Flytta upp" disabled={!onMoveUp} onClick={onMoveUp}>
          <ArrowUp size={13} />
        </IconAction>
        <IconAction label="Flytta ned" disabled={!onMoveDown} onClick={onMoveDown}>
          <ArrowDown size={13} />
        </IconAction>
        <div className="flex-1" />
        <IconAction label="Ta bort sida" disabled={!onDelete} onClick={onDelete} danger>
          <Trash size={13} />
        </IconAction>
      </div>
    </div>
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

function IconAction({
  label,
  children,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
        disabled
          ? 'cursor-default border-[var(--border)] text-[var(--text-muted)] opacity-40'
          : danger
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}
