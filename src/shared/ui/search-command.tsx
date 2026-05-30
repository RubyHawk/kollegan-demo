'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SearchIcon } from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';

interface CommandItem {
  href: string;
  label: string;
  description: string;
  keywords: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  { href: '/', label: 'Översikt', description: 'Se läget i dashboarden', keywords: ['dashboard', 'start', 'oversikt'] },
  { href: '/offerter', label: 'Offerter', description: 'Bläddra bland alla offerter', keywords: ['offerter', 'lista', 'quotes'] },
  { href: '/offerter/ny', label: 'Ny offert', description: 'Skapa en ny offert direkt', keywords: ['ny', 'offert', 'create'] },
  { href: '/mallar', label: 'Mallar', description: 'Hantera offermallar och innehåll', keywords: ['mallar', 'templates'] },
  { href: '/produkter', label: 'Produkter', description: 'Uppdatera produkter och tjänster', keywords: ['produkter', 'services', 'produktbibliotek'] },
  { href: '/installningar/foretag', label: 'Företag', description: 'Se bolagsuppgifter, medlemmar och branding per företag', keywords: ['foretag', 'bolag', 'companies', 'branding'] },
  { href: '/installningar', label: 'Inställningar', description: 'Anpassa system och utseende', keywords: ['installningar', 'settings'] },
  { href: '/installningar/profil', label: 'Profil', description: 'Uppdatera konto och kontaktuppgifter', keywords: ['profil', 'konto', 'account'] },
];

export function SearchTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isMac =
    typeof navigator !== 'undefined' &&
    (navigator.platform?.toLowerCase().includes('mac') ||
      navigator.userAgent?.toLowerCase().includes('mac'));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COMMAND_ITEMS;

    return COMMAND_ITEMS.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        item.href,
        ...item.keywords,
      ].join(' ').toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query]);

  function openRoute(href: string) {
    setOpen(false);
    setQuery('');
    if (href !== pathname) router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-8 min-w-[280px] items-center gap-2 rounded-lg px-3',
          'border border-[var(--border-light)] bg-[var(--surface-0)] shadow-sm shadow-black/[0.02]',
          'text-sm text-[var(--text-muted)]',
          'hover:border-[var(--text-muted)]/30 hover:bg-[var(--surface-hover)]',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30',
        )}
        aria-label="Öppna snabbnavigering"
      >
        <SearchIcon size={14} />
        <span className="hidden flex-1 text-left text-[13px] sm:inline">Sök kund, offert, projekt...</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-[var(--border-light)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:inline-flex">
          {isMac ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery('');
        }}
      >
        <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-xl p-0">
          <DialogHeader className="border-b border-[var(--border)] px-5 pb-3 pt-5">
            <DialogTitle className="text-base text-[var(--text-primary)]">Snabbsök</DialogTitle>
            <DialogDescription>
              Hitta rätt sida snabbare utan att leta i menyn.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3">
              <SearchIcon size={15} className="text-[var(--text-muted)]" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && matches[0]) {
                    event.preventDefault();
                    openRoute(matches[0].href);
                  }
                }}
                placeholder="Sök på offert, produkt, mall eller inställning..."
                className="h-11 w-full border-0 bg-transparent p-0 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2">
            {matches.length > 0 ? (
              matches.map((item) => {
                const active = pathname === item.href;

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => openRoute(item.href)}
                    className={cn(
                      'flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition-colors',
                      active
                        ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                        : 'hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-0)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                      {active ? 'Nuvarande' : item.href}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">Inga träffar ännu</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Prova att söka på offert, mall, produkt eller inställning.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
