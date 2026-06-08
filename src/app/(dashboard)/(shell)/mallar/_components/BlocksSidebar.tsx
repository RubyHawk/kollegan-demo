'use client';

import { useMemo, useRef, useState } from 'react';
import { useTemplateEditor } from './editor-context';
import { useHeaderFooter } from './header-footer-context';
import PageNavigator from './PageNavigator';
import { uploadTemplateImage } from './template-image-upload';
import { insertTemplateImageIntoEditor } from './template-image-insert';
import { OFFER_PLACEHOLDERS } from '@modules/supporting/offers/domain/template.entity';
import {
  TEMPLATE_BLOCK_MIME,
  encodeInsertPayload,
  insertTemplatePayload,
  type InsertPayload,
} from './template-insert-actions';
import {
  Braces,
  Calendar,
  Heading1,
  Heading2,
  Image as ImageIcon,
  List,
  Minus,
  PenLine,
  Search,
  Table,
  Text,
  User,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

type BuilderTab = 'pages' | 'blocks' | 'variables' | 'media';

type LibraryItem = {
  id: string;
  label: string;
  description?: string;
  group: string;
  icon: React.ReactNode;
  payload: InsertPayload;
  clickOnly?: boolean;
};

function toKey(placeholder: string) {
  return placeholder.replace(/[{}]/g, '');
}

const VISIBLE_VARIABLES = OFFER_PLACEHOLDERS.filter(
  (p) => p.key !== '{{lineItems}}' && p.key !== '{{signature}}',
);

function getVariableGroup(key: string) {
  if (['offerNumber', 'offerTitle', 'quoteNumber'].includes(key)) return 'Offert';
  if (['recipientName', 'recipientEmail', 'recipientCompany'].includes(key)) return 'Kund';
  if (['totalExVat', 'totalIncVat', 'vatAmount'].includes(key)) return 'Pris';
  if (['createdDate', 'validUntil'].includes(key)) return 'Datum';
  return 'Innehåll';
}

export default function BlocksSidebar() {
  const editor = useTemplateEditor();
  const hf = useHeaderFooter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<BuilderTab>('pages');
  const [query, setQuery] = useState('');

  const activePage = hf?.pages[hf.activeIdx];
  const isDocumentPage = activePage?.kind === 'document';
  const isAppendixPage = activePage?.role === 'appendix' && !isDocumentPage;
  const isPageReady = hf?.activePageReady ?? true;

  const blockItems = useMemo<LibraryItem[]>(() => [
    {
      id: 'heading1',
      label: 'Rubrik 1',
      description: 'Stor rubrik för sidans huvudbudskap.',
      group: 'Textblock',
      icon: <Heading1 size={14} strokeWidth={1.75} />,
      payload: { kind: 'heading1' },
    },
    {
      id: 'heading2',
      label: 'Rubrik 2',
      description: 'Mellanrubrik för avsnitt.',
      group: 'Textblock',
      icon: <Heading2 size={14} strokeWidth={1.75} />,
      payload: { kind: 'heading2' },
    },
    {
      id: 'paragraph',
      label: 'Brödtext',
      description: 'Vanlig textyta.',
      group: 'Textblock',
      icon: <Text size={14} strokeWidth={1.75} />,
      payload: { kind: 'paragraph' },
    },
    {
      id: 'bulletList',
      label: 'Punktlista',
      description: 'Lista för leveranser eller fördelar.',
      group: 'Textblock',
      icon: <List size={14} strokeWidth={1.75} />,
      payload: { kind: 'bulletList' },
    },
    {
      id: 'table',
      label: 'Tabell',
      description: 'En enkel 3 x 3-tabell.',
      group: 'Struktur',
      icon: <Table size={14} strokeWidth={1.75} />,
      payload: { kind: 'table' },
    },
    {
      id: 'divider',
      label: 'Avdelare',
      description: 'Tunn linje mellan avsnitt.',
      group: 'Struktur',
      icon: <Minus size={14} strokeWidth={1.75} />,
      payload: { kind: 'divider' },
    },
    {
      id: 'signature',
      label: 'Signatur',
      description: 'Manuellt signaturfält på presentationssida.',
      group: 'Signatur',
      icon: <PenLine size={14} strokeWidth={1.75} />,
      payload: { kind: 'signature', label: 'Signatur' },
    },
    {
      id: 'signatureName',
      label: 'Namn',
      description: 'Fält för fullständigt namn.',
      group: 'Signatur',
      icon: <User size={14} strokeWidth={1.75} />,
      payload: { kind: 'signatureName', label: 'Fullständigt namn' },
    },
    {
      id: 'signatureDate',
      label: 'Datum',
      description: 'Fält för signeringsdatum.',
      group: 'Signatur',
      icon: <Calendar size={14} strokeWidth={1.75} />,
      payload: { kind: 'signatureDate', label: 'Signeringsdatum' },
    },
  ], []);

  const variableItems = useMemo<LibraryItem[]>(() => VISIBLE_VARIABLES.map((placeholder) => {
    const key = toKey(placeholder.key);
    return {
      id: key,
      label: placeholder.label,
      description: placeholder.key,
      group: getVariableGroup(key),
      icon: <Braces size={14} strokeWidth={1.75} />,
      payload: { kind: 'variable', key, label: placeholder.label },
    };
  }), []);

  const normalizedQuery = query.trim().toLocaleLowerCase('sv-SE');
  const visibleBlocks = filterItems(blockItems, normalizedQuery);
  const visibleVariables = filterItems(variableItems, normalizedQuery);

  if (!editor || !hf) {
    return (
      <aside className="hidden shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] xl:flex xl:w-[clamp(260px,20vw,340px)]" />
    );
  }

  async function insertImage(file: File) {
    const currentEditor = editor;
    if (!currentEditor) return;
    if (!hf?.activePageReady) {
      window.alert('Vänta tills sidan är färdigladdad innan du lägger in bilden.');
      return;
    }
    try {
      const src = await uploadTemplateImage(file);
      insertTemplateImageIntoEditor(currentEditor, src);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Kunde inte ladda upp bilden.');
    }
  }

  function runPayload(payload: InsertPayload) {
    if (!isPageReady) return;
    if (payload.kind === 'image') {
      fileRef.current?.click();
      return;
    }
    const currentEditor = editor;
    if (!currentEditor) return;
    insertTemplatePayload(currentEditor, payload);
  }

  return (
    <aside className="hidden min-h-0 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] xl:flex xl:w-[clamp(260px,20vw,340px)]">
      <div className="shrink-0 border-b border-[var(--ui-border)] px-3 py-3">
        <p className="text-[12px] font-semibold text-[var(--ui-text)]">Mallbyggare</p>
        <p className="mt-1 text-[11px] leading-4 text-[var(--ui-text-muted)]">
          Styr sidflödet, klicka in block eller dra dem till dokumentytan.
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]">
        {[
          { key: 'pages', label: 'Sidor' },
          { key: 'blocks', label: 'Block' },
          { key: 'variables', label: 'Variabler' },
          { key: 'media', label: 'Media' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as BuilderTab)}
            className={cn(
              'h-9 border-r border-[var(--ui-border)] text-[11px] font-semibold transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
              tab === item.key
                ? 'bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'pages' ? (
        <PageNavigator />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-3 py-3">
            <label className="flex h-8 items-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 text-[12px] text-[var(--ui-text)] focus-within:ring-2 focus-within:ring-[var(--ui-focus)]">
              <Search size={14} strokeWidth={1.75} className="shrink-0 text-[var(--ui-text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tab === 'variables' ? 'Sök variabel...' : 'Sök block...'}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--ui-text-muted)]"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {isDocumentPage ? (
              <div className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-3 py-3 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
                Den här sidan är en strukturerad offertsida. Lägg till fria presentationssidor för manuell layout, bilder och variabler.
              </div>
            ) : (
              <>
                {!isPageReady && (
                  <div className="mb-3 rounded-lg border border-dashed border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] px-3 py-2 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
                    Laddar rätt sida i editorn. Vänta en halv sekund innan du lägger in bild eller text.
                  </div>
                )}

                {tab === 'blocks' && (
                  <LibraryGroups
                    items={visibleBlocks}
                    onInsert={runPayload}
                    disabled={!isPageReady}
                  />
                )}

                {tab === 'variables' && (
                  <LibraryGroups
                    items={visibleVariables}
                    onInsert={runPayload}
                    disabled={!isPageReady}
                    showToken
                  />
                )}

                {tab === 'media' && (
                  <div className="space-y-3">
                    {isAppendixPage && (
                      <div className="rounded-lg border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] px-3 py-2 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
                        Bilagor passar bäst för en eller flera uppladdade bilder. Du kan också släppa bildfiler direkt på canvasen.
                      </div>
                    )}
                    <LibraryItemButton
                      item={{
                        id: 'image',
                        label: isAppendixPage ? 'Lägg till bild till bilagan' : 'Bild',
                        description: 'Välj en bildfil eller släpp en bild direkt på sidan.',
                        group: 'Media',
                        icon: <ImageIcon size={14} strokeWidth={1.75} />,
                        payload: { kind: 'image' },
                        clickOnly: true,
                      }}
                      disabled={!isPageReady}
                      onInsert={runPayload}
                    />
                    <div className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-3 py-3 text-[11px] leading-5 text-[var(--ui-text-secondary)]">
                      Tips: dra en bildfil från datorn till dokumentytan för att placera den på aktiv sida.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

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
    </aside>
  );
}

function filterItems(items: LibraryItem[], normalizedQuery: string) {
  if (!normalizedQuery) return items;
  return items.filter((item) => {
    const haystack = `${item.label} ${item.description ?? ''} ${item.group}`.toLocaleLowerCase('sv-SE');
    return haystack.includes(normalizedQuery);
  });
}

function LibraryGroups({
  items,
  onInsert,
  disabled,
  showToken = false,
}: {
  items: LibraryItem[];
  onInsert: (payload: InsertPayload) => void;
  disabled: boolean;
  showToken?: boolean;
}) {
  const groups = Array.from(new Set(items.map((item) => item.group)));
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-raised)] px-3 py-3 text-[11px] text-[var(--ui-text-muted)]">
        Inga träffar.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">{group}</p>
          <div className="space-y-1.5">
            {items.filter((item) => item.group === group).map((item) => (
              <LibraryItemButton
                key={item.id}
                item={item}
                disabled={disabled}
                onInsert={onInsert}
                showToken={showToken}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LibraryItemButton({
  item,
  disabled,
  onInsert,
  showToken = false,
}: {
  item: LibraryItem;
  disabled: boolean;
  onInsert: (payload: InsertPayload) => void;
  showToken?: boolean;
}) {
  return (
    <button
      type="button"
      draggable={!disabled && !item.clickOnly}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData(TEMPLATE_BLOCK_MIME, encodeInsertPayload(item.payload));
        event.dataTransfer.setData('text/plain', item.label);
      }}
      onClick={() => onInsert(item.payload)}
      disabled={disabled}
      title={item.clickOnly ? 'Klicka för att välja fil' : 'Klicka för att infoga eller dra till sidan'}
      className="flex w-full items-start gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-2 text-left transition-colors hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-selected)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] disabled:cursor-not-allowed disabled:border-[var(--ui-border)] disabled:bg-[var(--ui-disabled-bg)] disabled:text-[var(--ui-text-disabled)] disabled:opacity-80"
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-[var(--ui-text)]">{item.label}</span>
        {item.description && (
          <span className={cn('mt-0.5 block text-[10px] leading-4 text-[var(--ui-text-muted)]', showToken ? 'font-mono' : '')}>
            {item.description}
          </span>
        )}
      </span>
    </button>
  );
}

