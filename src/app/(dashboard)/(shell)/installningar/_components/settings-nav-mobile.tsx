'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { getVisibleSettings } from '@shared/nav/settings-config';
import { cn } from '@shared/lib/utils';

// Mobile settings nav — a pinned, horizontally scrollable chip row above the page
// header. The active chip scrolls itself into view so deep links (e.g. Användare,
// last of 12) never land with the current page off-screen.
export default function SettingsNavMobile({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeRef = useRef<HTMLAnchorElement>(null);

  const items = getVisibleSettings(userRole).flatMap((section) => section.items);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [pathname, prefersReducedMotion]);

  return (
    <nav
      aria-label="Inställningar"
      className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 md:hidden"
    >
      {items.map((item) => {
        const active = isActive(item.href);
        const ItemIcon = item.icon;
        return (
          <Link
            key={item.href}
            ref={active ? activeRef : undefined}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
              active
                ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]'
                : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]',
            )}
          >
            <ItemIcon size={14} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
