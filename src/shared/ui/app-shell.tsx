'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@shared/ui/sidebar';
import { MenuIcon, ChevronRightIcon } from '@shared/ui/icons';
import { SearchTrigger } from '@shared/ui/search-command';

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

// ─── Breadcrumb helpers ─────────────────────────────────────────────────────

const SEG_LABELS: Record<string, string> = {
  crm:          'CRM',
  demos:        'Demos',
  analytics:    'Analytics',
  reports:      'Reports',
  projects:     'Projects',
  messages:     'Messages',
  settings:     'Settings',
  admin:        'Admin',
  compliance:   'Compliance',
  billing:      'Billing',
  users:        'Users',
  profile:      'Profile',
  integrations: 'Integrations',
};

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: SEG_LABELS[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1)),
    href:  i < segs.length - 1 ? '/' + segs.slice(0, i + 1).join('/') : null,
  }));
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

  const crumbs = buildCrumbs(pathname);

  // ─── Desktop topbar ──────────────────────────────────────────────────────

  const topbar = (
    <div className="hidden md:flex items-center justify-between h-12 px-5 border-b border-[var(--border)] glass-header shrink-0">
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
      <SearchTrigger />
    </div>
  );

  // ─── Root layout ─────────────────────────────────────────────────────────

  return (
    <div className="h-dvh flex overflow-hidden bg-[var(--page-bg)]">

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          user={user}
          collapsed={false}
          onToggleCollapse={toggleCollapse}
          onLogout={handleLogout}
          onMobileClose={() => setMobileOpen(false)}
        />
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

        <main className="flex-1 overflow-y-auto scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}
