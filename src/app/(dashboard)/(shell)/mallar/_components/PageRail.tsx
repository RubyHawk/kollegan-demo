'use client';

import { useMemo, useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  ChatText,
  ClipboardText,
  File,
  FileArrowUp,
  NotePencil,
  Plus,
  Quotes,
  Signature,
  Trash,
} from '@phosphor-icons/react';
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

  const activePage = hf?.pages[hf.activeIdx];
  const activeDescription = useMemo(() => {
    if (!activePage) return 'Bygg sidflödet från vänster till höger.';
    if (activePage.kind === 'document') {
      return 'Offertsidan är systemstyrd. Justera layout och text snarare än manuell tabellbyggnad.';
    }
    return 'Presentationssidor är friare och passar för bild, text, case och berättelse.';
  }, [activePage]);

  if (!hf) return null;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-1)] px-3 py-3">
      <div className="relative rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Sidor</p>
            <p className="mt-1 max-w-[62ch] text-xs leading-5 text-[var(--text-muted)]">{activeDescription}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBlueprints((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={13} weight="bold" />
              Lägg till sida
            </button>

            {showBlueprints && (
              <div className="absolute right-0 bottom-[calc(100%+10px)] z-20 w-[280px] rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                <div className="space-y-1">
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
                      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-active)]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
                        {blueprint.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">{blueprint.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{blueprint.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max items-stretch gap-2 px-1">
            {hf.pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => hf.switchPage(index)}
                className={cn(
                  'min-w-[188px] rounded-[22px] border px-3 py-3 text-left transition-all md:min-w-[204px]',
                  index === hf.activeIdx
                    ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] shadow-[0_10px_26px_rgba(37,99,235,0.12)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-active)]'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{page.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                        page.kind === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {getPageBadge(page)}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {page.includeInCustomerPdf === false ? 'Intern' : 'Med i PDF'}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]">{index + 1}/{hf.pages.length}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <MiniAction label="Flytta åt vänster" onClick={index > 0 ? () => hf.movePage(index, index - 1) : undefined}>
                    <CaretLeft size={13} />
                  </MiniAction>
                  <MiniAction label="Flytta åt höger" onClick={index < hf.pages.length - 1 ? () => hf.movePage(index, index + 1) : undefined}>
                    <CaretRight size={13} />
                  </MiniAction>
                  <div className="flex-1" />
                  <MiniAction label="Ta bort sida" danger onClick={hf.pages.length > 1 ? () => hf.removePage(index) : undefined}>
                    <Trash size={13} />
                  </MiniAction>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniAction({
  label,
  children,
  onClick,
  danger = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const disabled = !onClick;

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
          ? 'cursor-default border-[var(--border)] text-[var(--text-muted)] opacity-35'
          : danger
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}
