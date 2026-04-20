'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@shared/ui/sidebar';
import { MenuIcon, ChevronRightIcon } from '@shared/ui/icons';
import { SearchTrigger } from '@shared/ui/search-command';
import { BrandLockup } from '@shared/ui/brand';
import { logout } from '@shared/lib/api/auth-account.api';

interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
}

interface Props {
  user: User;
  children: React.ReactNode;
}

const SEG_LABELS: Record<string, string> = {
  offerter: 'Offerter',
  ny: 'Ny offert',
  mallar: 'Mallar',
  produkter: 'Produkter',
  installningar: 'Inställningar',
  anvandare: 'Användare',
  profil: 'Profil',
  fakturering: 'Fakturering',
  integrationer: 'Integrationer',
  'logga-in': 'Logga in',
  crm: 'CRM',
  demos: 'Demos',
  analytics: 'Analys',
  reports: 'Rapporter',
  projects: 'Projekt',
  messages: 'Meddelanden',
  admin: 'Admin',
  compliance: 'Efterlevnad',
  billing: 'Fakturering',
  users: 'Användare',
  profile: 'Profil',
  integrations: 'Integrationer',
};

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: SEG_LABELS[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1)),
    href: i < segs.length - 1 ? `/${segs.slice(0, i + 1).join('/')}` : null,
  }));
}

const LS_KEY = 'sidebar-collapsed';

export default function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LS_KEY) === 'true';
  });

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(LS_KEY, String(next));
  }

  async function handleLogout() {
    await logout();
    router.push('/logga-in');
    router.refresh();
  }

  const crumbs = buildCrumbs(pathname);
  const isImmersiveTemplateEditor = pathname.startsWith('/mallar/') && pathname !== '/mallar';

  const topbar = (
    <div className="glass-header hidden h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-5 md:flex">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon size={12} className="mx-0.5 shrink-0 text-[var(--text-muted)]" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-[var(--text-primary)]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <SearchTrigger />
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--page-bg)]">
      <div className="hidden h-full md:flex">
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onLogout={handleLogout}
        />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          user={user}
          collapsed={false}
          onToggleCollapse={toggleCollapse}
          onLogout={handleLogout}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!isImmersiveTemplateEditor && (
          <div className="glass-header flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              aria-label="Öppna meny"
            >
              <MenuIcon size={18} />
            </button>
            <BrandLockup size={22} className="gap-2" textClassName="font-heading text-sm text-[var(--text-primary)]" />
          </div>
        )}

        {!isImmersiveTemplateEditor && topbar}

        <main className="scrollbar-none flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
