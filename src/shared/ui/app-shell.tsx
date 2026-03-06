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
  UserIcon,
  CompanyIcon,
  BuildingIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from '@shared/ui/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Nav structure ───────────────────────────────────────────────────────────

const CRM_CHILDREN = [
  { href: '/crm/contacts',  label: 'Kontakter', Icon: UserIcon    },
  { href: '/crm/companies', label: 'Företag',   Icon: CompanyIcon },
];

// ─── Breadcrumb helpers ──────────────────────────────────────────────────────

const SEG_LABELS: Record<string, string> = {
  crm:       'CRM',
  contacts:  'Kontakter',
  companies: 'Företag',
  demos:     'Demos',
  settings:  'Inställningar',
  admin:     'Admin',
};

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: SEG_LABELS[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1)),
    href:  i < segs.length - 1 ? '/' + segs.slice(0, i + 1).join('/') : null,
  }));
}

// ─── Icon-only tooltip wrapper ───────────────────────────────────────────────

function WithTooltip({ label, side = 'right', children }: { label: string; side?: 'right' | 'top'; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children as React.ReactElement}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_KEY = 'sidebar-collapsed';

// Shared classes
const NAV_BASE   = 'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 border';
const NAV_IDLE   = 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-1)] hover:border-[var(--border)] hover:text-[var(--text-primary)]';
const NAV_ACTIVE = 'bg-[var(--accent)]/8 text-[var(--accent)] border-[var(--accent)]/20';
const NAV_DEMOS_ACTIVE = 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-400/20';

// ─── AppShell ────────────────────────────────────────────────────────────────

export default function AppShell({ user, children }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [crmOpen,    setCrmOpen]    = useState(() => pathname.startsWith('/crm'));

  useEffect(() => {
    if (localStorage.getItem(LS_KEY) === 'true') setCollapsed(true);
  }, []);

  // Auto-open CRM section when navigating to a CRM sub-route
  useEffect(() => {
    if (pathname.startsWith('/crm')) setCrmOpen(true);
  }, [pathname]);

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

  const crmActive = pathname.startsWith('/crm');

  // ─── Sidebar ─────────────────────────────────────────────────────────────

  const sidebar = (
    <TooltipProvider delayDuration={150}>
      <aside className={[
        'h-full flex flex-col bg-[var(--surface-0)] border-r border-[var(--border)]',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[52px]' : 'w-[220px]',
      ].join(' ')}>

        {/* Logo ─────────────────────────────────────────────────────────── */}
        <div className={[
          'flex items-center shrink-0 h-[52px] border-b border-[var(--border)]',
          collapsed ? 'justify-center' : 'px-4 gap-2.5',
        ].join(' ')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-heading text-sm font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
              Kollegan
            </span>
          )}
        </div>

        {/* Nav ─────────────────────────────────────────────────────────── */}
        <nav
          className={[
            'flex-1 py-3 flex flex-col overflow-y-auto',
            collapsed ? 'px-1.5 items-center gap-0.5 overflow-hidden' : 'px-2.5 gap-0.5',
          ].join(' ')}
          style={collapsed ? { scrollbarWidth: 'none' } : undefined}
        >

          {/* Översikt */}
          {collapsed ? (
            <WithTooltip label="Översikt">
              <Link href="/" onClick={() => setMobileOpen(false)}
                className={[NAV_BASE, 'justify-center w-8 h-8 p-0', pathname === '/' ? NAV_ACTIVE : NAV_IDLE].join(' ')}>
                <HomeIcon size={15} />
              </Link>
            </WithTooltip>
          ) : (
            <Link href="/" onClick={() => setMobileOpen(false)}
              className={[NAV_BASE, 'px-2.5 py-2', pathname === '/' ? NAV_ACTIVE : NAV_IDLE].join(' ')}>
              <HomeIcon size={15} />
              Översikt
            </Link>
          )}

          {/* CRM (with dropdown) */}
          {collapsed ? (
            <WithTooltip label="CRM">
              <Link href="/crm" onClick={() => setMobileOpen(false)}
                className={[NAV_BASE, 'justify-center w-8 h-8 p-0', crmActive ? NAV_ACTIVE : NAV_IDLE].join(' ')}>
                <UsersIcon size={15} />
              </Link>
            </WithTooltip>
          ) : (
            <div>
              {/* CRM header — click toggles the submenu */}
              <button
                onClick={() => setCrmOpen((o) => !o)}
                className={[
                  NAV_BASE, 'w-full px-2.5 py-2 justify-between',
                  crmActive ? NAV_ACTIVE : NAV_IDLE,
                ].join(' ')}
              >
                <span className="flex items-center gap-2.5">
                  <UsersIcon size={15} />
                  CRM
                </span>
                <ChevronDownIcon
                  size={13}
                  className={['transition-transform duration-150 text-[var(--text-muted)]', crmOpen ? 'rotate-180' : ''].join(' ')}
                />
              </button>

              {/* Sub-items */}
              {crmOpen && (
                <div className="mt-0.5 ml-3.5 pl-2.5 border-l border-[var(--border)] flex flex-col gap-0.5">
                  {CRM_CHILDREN.map(({ href, label, Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                        className={[
                          NAV_BASE, 'px-2.5 py-1.5 text-xs',
                          active ? NAV_ACTIVE : NAV_IDLE,
                        ].join(' ')}>
                        <Icon size={13} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {!collapsed && (
            <div className="my-2 border-t border-[var(--border)]" />
          )}
          {collapsed && <div className="my-1.5 w-5 border-t border-[var(--border)]" />}

          {/* Demos */}
          {collapsed ? (
            <WithTooltip label="Demos">
              <Link href="/demos" onClick={() => setMobileOpen(false)}
                className={[NAV_BASE, 'justify-center w-8 h-8 p-0', pathname.startsWith('/demos') ? NAV_DEMOS_ACTIVE : NAV_IDLE].join(' ')}>
                <BuildingIcon size={15} />
              </Link>
            </WithTooltip>
          ) : (
            <>
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Demos
              </p>
              <Link href="/demos" onClick={() => setMobileOpen(false)}
                className={[NAV_BASE, 'px-2.5 py-2', pathname.startsWith('/demos') ? NAV_DEMOS_ACTIVE : NAV_IDLE].join(' ')}>
                <BuildingIcon size={15} />
                Alla demos
              </Link>
            </>
          )}
        </nav>

        {/* Bottom ─────────────────────────────────────────────────────────── */}
        <div className={[
          'shrink-0 border-t border-[var(--border)] py-2 flex flex-col',
          collapsed ? 'px-1.5 items-center gap-1' : 'px-2.5 gap-1',
        ].join(' ')}>

          {/* Profile */}
          {collapsed ? (
            <WithTooltip label={displayName}>
              <Link href="/settings" onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] flex items-center justify-center transition-all">
                <div className="w-6 h-6 rounded-md bg-[var(--accent)]/15 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[var(--accent)]">{initials}</span>
                </div>
              </Link>
            </WithTooltip>
          ) : (
            <Link href="/settings" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] transition-all group">
              <div className="w-6 h-6 rounded-md bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-[var(--accent)]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate capitalize leading-tight">{user.role}</p>
              </div>
              <SettingsIcon size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          )}

          {/* ThemeToggle */}
          {collapsed ? (
            <WithTooltip label="Byt tema">
              <div>
                <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] transition-all text-[var(--text-muted)]" />
              </div>
            </WithTooltip>
          ) : (
            <ThemeToggle className="w-full h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] transition-all text-[var(--text-muted)] text-xs gap-2" />
          )}

          {/* Logout */}
          {collapsed ? (
            <WithTooltip label="Logga ut">
              <button onClick={handleLogout} aria-label="Logga ut"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900 hover:bg-red-500/8 text-[var(--text-muted)] hover:text-red-500 transition-all">
                <LogOutIcon size={14} />
              </button>
            </WithTooltip>
          ) : (
            <button onClick={handleLogout} aria-label="Logga ut"
              className="flex items-center gap-2.5 px-2.5 h-8 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900 hover:bg-red-500/8 text-xs text-[var(--text-muted)] hover:text-red-500 transition-all">
              <LogOutIcon size={13} />
              Logga ut
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );

  // ─── Desktop topbar ──────────────────────────────────────────────────────

  const topbar = (
    <div className="hidden md:flex items-center h-[52px] px-4 border-b border-[var(--border)] bg-[var(--surface-0)] shrink-0 gap-3">

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expandera sidebar' : 'Minimera sidebar'}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all shrink-0"
      >
        {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-[var(--border)] shrink-0" />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon size={11} className="text-[var(--text-muted)] shrink-0" />}
            {crumb.href ? (
              <Link href={crumb.href}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-1 py-0.5 rounded hover:bg-[var(--surface-1)]">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm text-[var(--text-primary)] font-medium px-1">{crumb.label}</span>
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
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 h-[52px] border-b border-[var(--border)] bg-[var(--surface-0)]">
          <button onClick={() => setMobileOpen(true)} aria-label="Öppna meny"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-1)] text-[var(--text-secondary)] transition-all">
            <MenuIcon size={17} />
          </button>
          <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">Kollegan</span>
        </div>

        {/* Desktop topbar */}
        {topbar}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
