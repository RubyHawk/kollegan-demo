'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import Sidebar from '@shared/ui/sidebar';
import { MenuIcon, ChevronRightIcon, PlusIcon } from '@shared/ui/icons';
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
  projekt: 'Projekt',
  installningar: 'Inställningar',
  anvandare: 'Användare',
  profil: 'Profil',
  fakturering: 'Fakturering',
  'anpassade-falt': 'Anpassade fält',
  integrationer: 'Integrationer',
  'logga-in': 'Logga in',
  crm: 'CRM',
  contacts: 'Kontakter',
  leads: 'Leads',
  meetings: 'Möten',
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

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function labelForSegment(segment: string, previous?: string) {
  if (previous === 'projekt' && UUID_SEGMENT.test(segment)) return 'Projektdetalj';
  return SEG_LABELS[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1));
}

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: labelForSegment(seg, segs[i - 1]),
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
    <div className="glass-header hidden h-14 shrink-0 items-center justify-between border-b border-[var(--ui-border)] px-5 md:flex">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon size={12} className="mx-0.5 shrink-0 text-[var(--ui-text-muted)]" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-[var(--ui-text)]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <SearchTrigger />
        <Link
          href="/installningar/notifieringar"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          aria-label="Notifieringar"
        >
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ui-accent)] text-[9px] font-bold text-[var(--ui-text-inverse)]">2</span>
        </Link>
        <Link
          href="/offerter/ny"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--ui-accent)] px-3 text-sm font-semibold text-[var(--ui-text-inverse)] transition-colors hover:bg-[var(--ui-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        >
          <PlusIcon size={14} />
          Ny offert
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--ui-bg)]">
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
          className="fixed inset-0 z-40 bg-[var(--ui-overlay)] backdrop-blur-sm md:hidden"
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
          <div className="glass-header flex items-center gap-3 border-b border-[var(--ui-border)] px-4 py-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              aria-label="Öppna meny"
            >
              <MenuIcon size={18} />
            </button>
            <BrandLockup size={22} className="gap-2" textClassName="font-heading text-sm text-[var(--ui-text)]" />
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
