'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ClipboardList,
  File,
  FileText,
  FileUp,
  GripVertical,
  MessageSquareText,
  PencilLine,
  Plus,
  Quote,
  ScrollText,
  Trash2,
} from 'lucide-react';
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { useHeaderFooter } from './header-footer-context';
import { EMPTY_DOC, PAGE_ROLE_LABELS, type PageDoc, type PageRole } from './template-doc';

type PageBlueprint = {
  key: string;
  label: string;
  role: PageRole;
  kind: 'presentation' | 'document';
  includeInCustomerPdf: boolean;
  description: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  body: object;
};

const PAGE_BLUEPRINTS: PageBlueprint[] = [
  {
    key: 'blank',
    label: 'Tom sida',
    role: 'custom',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'En fri sida för egen text, bild och layout.',
    icon: File,
    body: EMPTY_DOC,
  },
  {
    key: 'cover',
    label: 'Omslag',
    role: 'cover',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Förstasida med rubrik, bild och offertkänsla.',
    icon: FileText,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Offert' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Skriv en kort öppning eller placera en stark bild här.' }] },
      ],
    },
  },
  {
    key: 'introduction',
    label: 'Introduktion',
    role: 'introduction',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Bakgrund, värde, upplägg eller kundcase.',
    icon: MessageSquareText,
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Introduktion' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Berätta varför lösningen passar kunden.' }] },
      ],
    },
  },
  {
    key: 'offer',
    label: 'Offertsida',
    role: 'offer',
    kind: 'document',
    includeInCustomerPdf: true,
    description: 'Pris, summering, villkor och offertmetadata.',
    icon: PencilLine,
    body: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Kort introduktion eller extra förtydligande till kunden.' }] },
      ],
    },
  },
  {
    key: 'scope',
    label: 'Scope',
    role: 'scope',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Leveransomfattning och avgränsningar.',
    icon: ClipboardList,
    body: {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Leverans & omfattning' }] }],
    },
  },
  {
    key: 'references',
    label: 'Referenser',
    role: 'references',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Kundcitat, case eller social proof.',
    icon: Quote,
    body: {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Referenser' }] }],
    },
  },
  {
    key: 'terms',
    label: 'Villkor',
    role: 'terms',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Längre villkor utanför offertsidan.',
    icon: ScrollText,
    body: {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Villkor' }] }],
    },
  },
  {
    key: 'appendix',
    label: 'Bilaga',
    role: 'appendix',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Bildbilaga eller extra material.',
    icon: FileUp,
    body: EMPTY_DOC,
  },
];

type PageTone = {
  rail: string;
  badge: string;
  short: string;
};

function getPageBadge(page: PageDoc) {
  if (page.kind === 'document') return 'Offertsida';
  return PAGE_ROLE_LABELS[page.role ?? 'custom'];
}

function getPageTone(page: PageDoc): PageTone {
  if (page.kind === 'document') {
    return {
      rail: 'bg-[var(--ui-text)]',
      badge: 'border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)]',
      short: 'OF',
    };
  }
  switch (page.role) {
    case 'cover':
      return { rail: 'bg-[var(--ui-success-text)]', badge: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]', short: 'OM' };
    case 'appendix':
      return { rail: 'bg-[var(--ui-warning-text)]', badge: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]', short: 'BI' };
    case 'terms':
      return { rail: 'bg-[var(--ui-text-muted)]', badge: 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]', short: 'VI' };
    case 'references':
      return { rail: 'bg-[var(--ui-info-text)]', badge: 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]', short: 'RE' };
    default:
      return { rail: 'bg-[var(--ui-accent)]', badge: 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]', short: 'PR' };
  }
}

export default function PageNavigator() {
  const hf = useHeaderFooter();
  const [showBlueprints, setShowBlueprints] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activePage = hf?.pages[hf.activeIdx];
  const activeDescription = useMemo(() => {
    if (!activePage) return 'Lägg till sidor och dra dem för att styra offertflödet.';
    if (activePage.kind === 'document') return 'Strukturerad offertsida med pris, summering och villkor.';
    if (activePage.role === 'cover') return 'Omslagssida som visas för kunden och i PDF om den inte markeras intern.';
    return 'Presentationssida för text, bild, case, villkor eller bilagor.';
  }, [activePage]);

  useEffect(() => {
    if (!showBlueprints) return;
    function handleMouseDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowBlueprints(false);
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[var(--ui-border)] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--ui-text)]">Sidor</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--ui-text-muted)]">{activeDescription}</p>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <Button type="button" size="compact" onClick={() => setShowBlueprints((value) => !value)}>
              <Plus size={16} strokeWidth={2} />
              Sida
            </Button>
            {showBlueprints ? (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+6px)] z-30 w-[270px] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-1.5 shadow-[var(--ui-shadow-raised)]"
              >
                {PAGE_BLUEPRINTS.map((blueprint) => {
                  const Icon = blueprint.icon;
                  return (
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
                      className="flex w-full items-start gap-2 rounded-[var(--ui-radius-md)] px-2 py-2 text-left transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]">
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[var(--ui-text)]">{blueprint.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--ui-text-muted)]">{blueprint.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mall-page-list min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={hf.pages.map((page) => page.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {hf.pages.map((page, index) => (
                <SortablePageRow
                  key={page.id}
                  page={page}
                  index={index}
                  total={hf.pages.length}
                  isActive={index === hf.activeIdx}
                  onSelect={() => hf.switchPage(index)}
                  onRename={(label) => hf.renamePage(index, label)}
                  onRemove={hf.pages.length > 1 ? () => hf.removePage(index) : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <style>{`
        .mall-page-list {
          scrollbar-width: none;
        }
        .mall-page-list::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}

function SortablePageRow({
  page,
  index,
  total,
  isActive,
  onSelect,
  onRename,
  onRemove,
}: {
  page: PageDoc;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const tone = getPageTone(page);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function stopDnd(event: React.PointerEvent) {
    event.stopPropagation();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden rounded-[var(--ui-radius-md)] border bg-[var(--ui-surface)] p-2 transition-colors',
        isDragging
          ? 'z-10 border-[var(--ui-border-strong)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]'
          : isActive
            ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
            : 'border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-hover)]',
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', tone.rail)} />
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Dra för att flytta sidan"
          onPointerDown={stopDnd}
          {...attributes}
          {...listeners}
          className="mt-1 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-muted)] active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        >
          <GripVertical size={16} strokeWidth={1.75} />
        </button>

        <div className="mt-0.5 flex h-9 w-7 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] text-[9px] font-bold uppercase text-[var(--ui-text-muted)]">
          {tone.short}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold text-[var(--ui-text-muted)]">{index + 1}/{total}</span>
            {isActive ? (
              <input
                value={page.label}
                onPointerDown={stopDnd}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onRename(event.target.value)}
                className="min-w-0 flex-1 rounded-[var(--ui-radius-sm)] border border-[var(--ui-accent-border)] bg-[var(--ui-surface)] px-1.5 py-0.5 text-xs font-semibold text-[var(--ui-text)] outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
              />
            ) : (
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--ui-text)]">{page.label}</p>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className={cn('rounded-[var(--ui-radius-sm)] border px-1.5 py-0.5 text-[9px] font-semibold uppercase', tone.badge)}>
              {getPageBadge(page)}
            </span>
            <span
              className={cn(
                'rounded-[var(--ui-radius-sm)] border px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                page.includeInCustomerPdf === false
                  ? 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-surface-raised)] text-[var(--ui-text-secondary)]',
              )}
            >
              {page.includeInCustomerPdf === false ? 'Intern' : 'Kund + PDF'}
            </span>
          </div>
        </div>

        <button
          type="button"
          title={onRemove ? 'Ta bort sida' : 'Minst en sida krävs'}
          disabled={!onRemove}
          onPointerDown={stopDnd}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
          className={cn(
            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
            onRemove
              ? 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]'
              : 'cursor-default text-[var(--ui-text-disabled)]',
          )}
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
