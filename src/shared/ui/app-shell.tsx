'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@shared/ui/theme-toggle';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@shared/ui/tooltip';
import {
  HomeIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@shared/ui/icons';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Nav config ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',    label: 'Översikt', Icon: HomeIcon,     exact: true },
  { href: '/crm', label: 'CRM',      Icon: UsersIcon,    exact: false },
];

// ─── Breadcrumb helpers ──────────────────────────────────────────────────────

const SEG_LABELS: Record<string, string> = {
  crm:      'CRM',
  demos:    'Demos',
  settings: 'Inställningar',
  admin:    'Admin',
};

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: SEG_LABELS[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1)),
    href:  i < segs.length - 1 ? '/' + segs.slice(0, i + 1).join('/') : null,
  }));
}

// ─── Nav item (works both expanded and collapsed) ────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  activeClass: string;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ href, label, Icon, active, activeClass, collapsed, onClick }: NavItemProps) {
  const base = [
    'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
    collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5 w-full',
    active
      ? activeClass
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]',
  ].join(' ');

  const link = (
    <Link href={href} onClick={onClick} className={base}>
      <Icon size={16} />
      {!collapsed && label}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── AppShell ────────────────────────────────────────────────────────────────

const LS_KEY = 'sidebar-collapsed';

export default function AppShell({ user, children }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY) === 'true') setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(LS_KEY, String(next));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials    = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const crumbs      = buildCrumbs(pathname);

  // ─── Sidebar ────────────────────────────────────────────────────────────

  const sidebar = (
    <TooltipProvider delayDuration={0}>
      <aside className={[
        'h-full flex flex-col glass-sidebar border-r border-[var(--border)]',
        'transition-[width] duration-200 ease-out overflow-hidden',
        collapsed ? 'w-14' : 'w-60',
      ].join(' ')}>

        {/* Logo */}
        <div className={[
          'flex items-center border-b border-[var(--border)] shrink-0 h-[61px]',
          collapsed ? 'justify-center' : 'px-5 gap-2.5',
        ].join(' ')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-heading text-base font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
              Kollegan
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className={[
          'flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto',
          collapsed ? 'px-2 items-center' : 'px-3',
        ].join(' ')}>
          {NAV_ITEMS.map(({ href, label, Icon, exact }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={exact ? pathname === href : pathname.startsWith(href)}
              activeClass="bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]/20"
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          {/* Demos section */}
          <div className={[
            'mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-0.5',
            collapsed ? 'w-full items-center' : '',
          ].join(' ')}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Demos
              </p>
            )}
            <NavItem
              href="/demos"
              label="Demos"
              Icon={BuildingIcon}
              active={pathname.startsWith('/demos')}
              activeClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[inset_0_0_0_1px_theme(colors.amber.400/0.25)]"
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </nav>

        {/* Bottom */}
        <div className={[
          'py-3 border-t border-[var(--border)] flex flex-col gap-1',
          collapsed ? 'px-2 items-center' : 'px-3',
        ].join(' ')}>

          {/* Profile */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings" onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 rounded-xl hover:bg-[var(--surface-1)] flex items-center justify-center transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{displayName}</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/settings" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-1)] transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{displayName}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">{user.role}</p>
              </div>
              <SettingsIcon size={13} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}

          {/* Controls row */}
          <div className={[
            'flex items-center gap-1 pt-0.5',
            collapsed ? 'flex-col' : 'px-1',
          ].join(' ')}>
            <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-[var(--surface-1)] border border-transparent hover:border-[var(--border)] transition-all text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleLogout} aria-label="Logga ut"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all">
                    <LogOutIcon size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logga ut</TooltipContent>
              </Tooltip>
            ) : (
              <button onClick={handleLogout} aria-label="Logga ut"
                className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all">
                <LogOutIcon size={14} />
                Logga ut
              </button>
            )}
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expandera sidebar' : 'Minimera sidebar'}
            className={[
              'hidden md:flex items-center justify-center h-7 rounded-lg',
              'text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)] transition-all mt-0.5',
              collapsed ? 'w-8' : 'w-full gap-1.5',
            ].join(' ')}
          >
            {collapsed
              ? <ChevronRightIcon size={13} />
              : <><ChevronLeftIcon size={13} /><span className="text-[11px]">Minimera</span></>
            }
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );

  // ─── Desktop topbar ──────────────────────────────────────────────────────

  const topbar = (
    <div className="hidden md:flex items-center h-12 px-5 border-b border-[var(--border)] glass-header shrink-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRightIcon size={12} className="text-[var(--text-muted)] mx-0.5 shrink-0" />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm text-[var(--text-primary)] font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );

  // ─── Root layout ─────────────────────────────────────────────────────────

  return (
    <div className="h-dvh flex overflow-hidden bg-[var(--page-bg)]">

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] glass-header">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-secondary)]"
            aria-label="Öppna meny"
          >
            <MenuIcon size={18} />
          </button>
          <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">Kollegan</span>
        </div>

        {/* Desktop topbar with breadcrumbs */}
        {topbar}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
