'use client';

import Link from 'next/link';
import { CalendarDays, ChefHat, ClipboardList, Clock, Home, ReceiptText, Users } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/utils';

const RESTAURANT_NAV = [
  { href: '/kassa', label: 'Kassa', icon: ReceiptText },
  { href: '/kok', label: 'Kök', icon: ChefHat },
  { href: '/ordrar', label: 'Ordrar', icon: ClipboardList },
  { href: '/bokningar', label: 'Bokningar', icon: CalendarDays },
  { href: '/narvaro', label: 'Närvaro', icon: Clock },
  { href: '/personal', label: 'Team', icon: Users },
] as const;

export function KassaPortalRail() {
  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-[var(--ui-border)] bg-[var(--ui-surface)] py-3 md:flex">
      <Link
        href="/kassa"
        className="mb-4 grid size-11 place-items-center rounded-[var(--ui-radius-lg)] bg-[var(--ui-accent)] text-sm font-bold text-[var(--ui-text-inverse)]"
        aria-label="Fluffy's kassa"
      >
        F
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {RESTAURANT_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/kassa';
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'grid size-11 place-items-center rounded-[var(--ui-radius-md)] border text-[var(--ui-text-secondary)] transition-colors',
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>
      <Button asChild variant="ghost" size="icon" aria-label="Dagens drift">
        <Link href="/">
          <Home size={18} strokeWidth={1.75} />
        </Link>
      </Button>
    </aside>
  );
}
