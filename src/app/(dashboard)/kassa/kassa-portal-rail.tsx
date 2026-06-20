'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  CalendarDays,
  ChefHat,
  ClipboardList,
  BookOpen,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

const RESTAURANT_NAV = [
  { href: '/kassa', label: 'Kassa', icon: ReceiptText },
  { href: '/kok', label: 'Kök', icon: ChefHat },
  { href: '/ordrar', label: 'Ordrar', icon: ClipboardList },
  { href: '/bokningar', label: 'Bokningar', icon: CalendarDays },
  { href: '/meny', label: 'Meny', icon: BookOpen },
  { href: '/personal', label: 'Personal', icon: Users },
  { href: '#dagavslut', label: 'Dagavslut', icon: CalendarCheck },
  { href: '/installningar', label: 'Inställningar', icon: Settings },
] as const;

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 0) return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function KassaPortalRail({
  employeeName,
  employeeEmail,
}: {
  employeeName: string;
  employeeEmail: string;
}) {
  return (
    <aside className="fluffy-pos-rail hidden w-[112px] shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-3 md:flex">
      <Link
        href="/kassa"
        className="mb-3 grid h-14 place-items-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] px-2"
        aria-label="Fluffy's kassa"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fluffys/favicon.svg" alt="" className="h-9 w-auto" />
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-1">
        {RESTAURANT_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/kassa';
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex h-10 items-center gap-2 rounded-[var(--ui-radius-md)] border px-2 text-xs font-semibold text-[var(--ui-text-secondary)] transition-colors',
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
              )}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-[var(--ui-border)] pt-3">
        <div className="flex items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-[var(--ui-radius-md)] bg-[var(--ui-accent)] text-xs font-bold text-[var(--ui-text-inverse)]">
            {initials(employeeName, employeeEmail)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--ui-text)]">{employeeName || 'Personal'}</p>
            <p className="truncate text-[11px] text-[var(--ui-text-muted)]">Kassa</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
