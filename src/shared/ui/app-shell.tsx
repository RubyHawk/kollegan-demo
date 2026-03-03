'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@shared/ui/theme-toggle';
import {
  HomeIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
} from '@shared/ui/icons';

interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Props {
  user: User;
  children: React.ReactNode;
}

const NAV = [
  { href: '/',    label: 'Översikt', Icon: HomeIcon },
  { href: '/crm', label: 'CRM',      Icon: UsersIcon },
];

export default function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials    = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebar = (
    <aside className="w-60 shrink-0 h-full flex flex-col glass-sidebar border-r border-[var(--border)]">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
          </svg>
        </div>
        <span className="font-heading text-base font-semibold text-[var(--text-primary)] tracking-tight">
          Kollegan
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]/20'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        {/* Demos section */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Demos
          </p>
          <Link
            href="/demos"
            onClick={() => setOpen(false)}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname.startsWith('/demos')
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[inset_0_0_0_1px_theme(colors.amber.400/0.25)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <BuildingIcon size={16} />
            Alla demos
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[var(--border)] flex flex-col gap-1">
        {/* Profile row */}
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-1)] transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">{user.role}</p>
          </div>
          <SettingsIcon size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Controls row */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-[var(--surface-1)] border border-transparent hover:border-[var(--border)] transition-all text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
          <button
            onClick={handleLogout}
            aria-label="Logga ut"
            className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
          >
            <LogOutIcon size={14} />
            Logga ut
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-dvh flex overflow-hidden bg-[var(--page-bg)]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] glass-header">
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-secondary)]"
            aria-label="Öppna meny"
          >
            <MenuIcon size={18} />
          </button>
          <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">Kollegan</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
