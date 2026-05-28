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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@shared/lib/utils';
import { useHeaderFooter } from './header-footer-context';
import { EMPTY_DOC, PAGE_ROLE_LABELS, type PageDoc, type PageRole } from './template-doc';

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
    key: 'blank',
    label: 'Tom sida',
    role: 'custom',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'En fri sida för egen text, bild och layout.',
    icon: <File size={16} />,
    body: EMPTY_DOC,
  },
  {
    key: 'cover',
    label: 'Omslag',
    role: 'cover',
    kind: 'presentation',
    includeInCustomerPdf: true,
    description: 'Förstasida med rubrik, bild och offertkänsla.',
    icon: <File size={16} />,
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
    icon: <ChatText size={16} />,
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
    icon: <NotePencil size={16} />,
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
    icon: <ClipboardText size={16} />,
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
    icon: <Quotes size={16} />,
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
    icon: <Signature size={16} />,
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
    icon: <FileArrowUp size={16} />,
    body: EMPTY_DOC,
  },
];

function getPageBadge(page: PageDoc) {
  if (page.kind === 'document') return 'Offertsida';
  return PAGE_ROLE_LABELS[page.role ?? 'custom'];
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
      <div className="shrink-0 border-b border-[var(--border)] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">Sidor</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">{activeDescription}</p>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowBlueprints((value) => !value)}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--accent)] px-2.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={12} weight="bold" />
              Sida
            </button>
            {showBlueprints && (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+6px)] z-30 w-[270px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
              >
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
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--surface-active)]"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--surface-2)] text-[var(--accent)]">
                      {blueprint.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-[var(--text-primary)]">{blueprint.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-muted)]">{blueprint.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={hf.pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
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
        'group rounded-lg border bg-[var(--surface)] p-2 transition-colors',
        isDragging
          ? 'z-10 border-[var(--accent-border)] bg-[var(--accent-subtle)] shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
          : isActive
            ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border)] hover:bg-[var(--surface-active)]',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Dra för att flytta sidan"
          onPointerDown={stopDnd}
          {...attributes}
          {...listeners}
          className="mt-1 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-[var(--text-muted)] active:cursor-grabbing"
        >
          <DotsSixVertical size={14} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold text-[var(--text-muted)]">{index + 1}/{total}</span>
            {isActive ? (
              <input
                value={page.label}
                onPointerDown={stopDnd}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onRename(event.target.value)}
                className="min-w-0 flex-1 rounded border border-[var(--accent-border)] bg-[var(--surface)] px-1.5 py-0.5 text-[12px] font-semibold text-[var(--text-primary)] outline-none"
              />
            ) : (
              <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[var(--text-primary)]">{page.label}</p>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]',
                page.kind === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600',
              )}
            >
              {getPageBadge(page)}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]',
                page.includeInCustomerPdf === false ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
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
            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors',
            onRemove
              ? 'text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500'
              : 'cursor-default text-[var(--text-muted)] opacity-35',
          )}
        >
          <Trash size={13} />
        </button>
      </div>
    </div>
  );
}
