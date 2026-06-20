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
  return email.slice(0, 2).toUpperCase() || '?';
}

export function KassaPortalRail({
  employeeName,
  employeeEmail,
}: {
  employeeName: string;
  employeeEmail: string;
}) {
  return (
    <aside className="fluffy-pos-rail hidden shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-4 md:flex">
      <Link
        href="/kassa"
        className="fluffy-pos-rail__brand mb-7 flex h-14 items-center px-2"
        aria-label="Fluffy's kassa"
      >
        <span className="fluffy-wordmark">Fluffy&apos;s</span>
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-2">
        {RESTAURANT_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/kassa';
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              data-active={active ? 'true' : undefined}
              className={cn(
                'fluffy-pos-rail__item flex h-14 items-center gap-3 rounded-[var(--ui-radius-md)] px-3 text-base font-semibold transition-colors',
                active && 'font-bold',
              )}
            >
              <Icon size={24} strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-[var(--ui-border)] pt-4">
        <div className="flex items-center gap-3 rounded-[var(--ui-radius-md)] p-1">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--ui-accent)] text-sm font-bold text-[var(--ui-text-inverse)]">
            {initials(employeeName, employeeEmail)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{employeeName || 'Personal'}</p>
            <p className="truncate text-xs text-[var(--ui-text-muted)]">Kassor</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
