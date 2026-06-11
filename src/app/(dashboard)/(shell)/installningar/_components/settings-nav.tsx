'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getVisibleSettings } from '@shared/nav/settings-config';
import { SearchIcon, CloseIcon } from '@shared/ui/icons';
import { cn } from '@shared/lib/utils';

// Desktop settings rail — deliberately lighter than the main sidebar so it reads
// as secondary navigation: icons on group titles only, items as a text list on a
// hairline guide, active item marked by a thin accent bar. The filter input stays
// pinned above the scrolling list. Mobile nav lives in settings-nav-mobile.tsx.
export default function SettingsNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  const sections = getVisibleSettings(userRole);
  const q = query.trim().toLowerCase();
  const filtered = sections
    .map((section) => ({
      ...section,
      items: q ? section.items.filter((item) => item.label.toLowerCase().includes(q)) : section.items,
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      aria-label="Inställningar"
      className="hidden w-60 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)] md:flex md:h-full"
    >
      <div className="shrink-0 px-3 pb-2 pt-4">
        <div className="relative">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sök inställning…"
            aria-label="Sök inställning"
            className="h-8 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-bg)] pl-8 pr-7 text-[13px] text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Rensa sökning"
              className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {filtered.length === 0 && (
          <div className="px-1 text-[13px] text-[var(--ui-text-muted)]">
            <p>Inga träffar.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-1 text-[var(--ui-accent)] transition-colors hover:text-[var(--ui-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
            >
              Rensa
            </button>
          </div>
        )}

        {filtered.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.key}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <SectionIcon size={14} className="text-[var(--ui-text-muted)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--ui-text-muted)]">
                  {section.label}
                </span>
              </div>
              <div className="relative ml-[10px] flex flex-col">
                <span className="absolute bottom-1 left-0 top-1 w-px bg-[var(--ui-border)]" />
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className="relative rounded-r-md py-[7px] pl-3.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                    >
                      {active && (
                        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-[var(--ui-accent)]" />
                      )}
                      <span
                        className={cn(
                          'transition-colors',
                          active
                            ? 'font-medium text-[var(--ui-accent)]'
                            : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]',
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
