'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatText,
  ClipboardText,
  DotsSixVertical,
  File,
  FileArrowUp,
  NotePencil,
  Plus,
  Quotes,
  Signature,
  Trash,
} from '@phosphor-icons/react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@shared/lib/utils';
import { useHeaderFooter } from './header-footer-context';
import { PAGE_ROLE_LABELS, type PageDoc, type PageRole } from './template-doc';

type PageBlueprint = {
  key: string;
  label: string;
  role: PageRole;
  kind: 'presentation' | 'document';
  includeInCustomerPdf: boolean;
  description: string;
  icon: React.ReactNode;
  body: object;
};

const PAGE_BLUEPRINTS: PageBlueprint[] = [
  {
    key: 'cover',
    label: 'Omslag',
    role: 'cover',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Visuell förstasida med titel och bild.',
    icon: <File size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Sätt tonen direkt' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Använd omslaget till en tydlig rubrik och stark visuell öppning.' }] },
      ],
    },
  },
  {
    key: 'introduction',
    label: 'Introduktion',
    role: 'introduction',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Andra sidan för värde, bilder eller upplägg.',
    icon: <ChatText size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Introduktion' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Sammanfatta varför lösningen passar kunden och bygg vidare med bild och text.' }] },
      ],
    },
  },
  {
    key: 'offer',
    label: 'Offertsida',
    role: 'offer',
    kind: 'document',
    includeInCustomerPdf: true,
    description: 'Strukturerad sida för pris, summering och villkor.',
    icon: <NotePencil size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Här kan du skriva en kort introduktion eller extra förtydligande till offerten.' }] },
      ],
    },
  },
  {
    key: 'scope',
    label: 'Scope',
    role: 'scope',
    kind: 'presentation',
    includeInCustomerPdf: false,
    description: 'Leveransomfattning och avgränsningar.',
    icon: <ClipboardText size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Leverans & omfattning' }] },
      ],
    },
  },
  {
    key: 'references',
    label: 'Referenser',
    role: 'references',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Kundcitat, case eller social proof.',
    icon: <Quotes size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Referenser' }] },
      ],
    },
  },
  {
    key: 'terms',
    label: 'Villkor',
    role: 'terms',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Längre villkor utanför själva offertsidan.',
    icon: <Signature size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Villkor' }] },
      ],
    },
  },
  {
    key: 'appendix',
    label: 'Bilaga',
    role: 'appendix',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Avslutande bilaga eller extra material.',
    icon: <FileArrowUp size={16} />,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bilaga' }] },
      ],
    },
  },
];

function getPageBadge(page: PageDoc) {
  if (page.kind === 'document') return 'Offertsida';
  return PAGE_ROLE_LABELS[page.role ?? 'custom'];
}

export default function PageRail() {
  const hf = useHeaderFooter();
  const [showBlueprints, setShowBlueprints] = useState(false);
  const blueprintRef = useRef<HTMLDivElement>(null);

  const activePage = hf?.pages[hf.activeIdx];
  const activeDescription = useMemo(() => {
    if (!activePage) return 'Bygg sidflödet från vänster till höger.';
    if (activePage.kind === 'document') {
      return 'Offertsidan är systemstyrd. Justera layout och text snarare än manuell tabellbyggnad.';
    }
    return 'Presentationssidor är friare och passar för bild, text, case och berättelse.';
  }, [activePage]);

  // Dismiss the blueprint dropdown on outside click or Escape.
  useEffect(() => {
    if (!showBlueprints) return;
    function handleMouseDown(event: MouseEvent) {
      if (blueprintRef.current && !blueprintRef.current.contains(event.target as Node)) {
        setShowBlueprints(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowBlueprints(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showBlueprints]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!hf || !over || active.id === over.id) return;
    const oldIndex = hf.pages.findIndex((page) => page.id === active.id);
    const newIndex = hf.pages.findIndex((page) => page.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    hf.movePage(oldIndex, newIndex);
  }

  if (!hf) return null;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-2 py-1.5">
      <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Sidor</p>
            <p className="hidden min-w-0 truncate text-[11px] text-[var(--text-muted)] sm:block">
              {activeDescription}
            </p>
          </div>
          <div className="relative" ref={blueprintRef}>
            <button
              type="button"
              onClick={() => setShowBlueprints((value) => !value)}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={11} weight="bold" />
              Lägg till sida
            </button>

            {showBlueprints && (
              <div
                role="menu"
                className="absolute right-0 bottom-[calc(100%+6px)] z-20 w-[260px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
              >
                <div className="space-y-0.5">
                  {PAGE_BLUEPRINTS.map((blueprint) => (
                    <button
                      key={blueprint.key}
                      type="button"
                      onClick={() => {
                        hf.addPage({
                          label: blueprint.label,
                          role: blueprint.role,
                          kind: blueprint.kind,
                          includeInCustomerPdf: blueprint.includeInCustomerPdf,
                          body: blueprint.body,
                        });
                        setShowBlueprints(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-active)]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--accent)]">
                        {blueprint.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[var(--text-primary)]">{blueprint.label}</span>
                        <span className="block truncate text-[11px] text-[var(--text-muted)]">{blueprint.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="-mx-0.5 overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={hf.pages.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex min-w-max items-stretch gap-1.5 px-0.5">
                {hf.pages.map((page, index) => (
                  <SortablePageCard
                    key={page.id}
                    page={page}
                    index={index}
                    total={hf.pages.length}
                    isActive={index === hf.activeIdx}
                    onSelect={() => hf.switchPage(index)}
                    onRemove={hf.pages.length > 1 ? () => hf.removePage(index) : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function SortablePageCard({
  page,
  index,
  total,
  isActive,
  onSelect,
  onRemove,
}: {
  page: PageDoc;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex min-w-[156px] items-center gap-1 rounded-md border px-1.5 py-1 transition-all md:min-w-[172px]',
        isActive
          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-active)]',
        isDragging && 'z-10 opacity-80 shadow-[0_10px_24px_rgba(15,23,42,0.14)]',
      )}
    >
      <button
        type="button"
        title="Dra för att flytta"
        className={cn(
          'inline-flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] active:cursor-grabbing',
          isDragging && 'cursor-grabbing text-[var(--accent)]',
        )}
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical size={13} />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col text-left focus:outline-none"
      >
        <div className="flex items-center gap-1">
          <span className="truncate text-xs font-semibold text-[var(--text-primary)]">{page.label}</span>
          <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{index + 1}/{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            'rounded px-1 py-px text-[9px] font-semibold uppercase tracking-[0.08em]',
            page.kind === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
          )}>
            {getPageBadge(page)}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {page.includeInCustomerPdf === false ? 'Intern' : 'PDF'}
          </span>
        </div>
      </button>
      <button
        type="button"
        title={onRemove ? 'Ta bort sida' : 'Minst en sida krävs'}
        disabled={!onRemove}
        onClick={(event) => {
          event.stopPropagation();
          onRemove?.();
        }}
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors',
          onRemove
            ? 'text-[var(--text-muted)] opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100'
            : 'cursor-default text-[var(--text-muted)] opacity-0',
        )}
      >
        <Trash size={12} />
      </button>
    </div>
  );
}
