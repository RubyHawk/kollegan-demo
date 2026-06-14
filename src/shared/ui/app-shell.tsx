'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import Sidebar from '@shared/ui/sidebar';
import { MenuIcon, ChevronRightIcon, PlusIcon } from '@shared/ui/icons';
import { SearchTrigger } from '@shared/ui/search-command';
import { BrandLockup, OrgBrandMark } from '@shared/ui/brand';
import { logout } from '@shared/lib/api/auth-account.api';
import { NAV_CRUMB_MAP, NAV_CONFIG, getNavConfigForModules, type ShellBrand, type User } from '@shared/ui/sidebar-config';

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function labelForSegment(segment: string, previous?: string): string {
  if (previous === 'projekt' && UUID_SEGMENT.test(segment)) return 'Projektdetalj';
  // "ny" label is derived from the parent dropdown's primaryAction — e.g. "Ny offert", "Ny faktura"
  if (segment === 'ny' && previous) {
    for (const section of NAV_CONFIG) {
      for (const entry of section.items) {
        if (entry.type === 'dropdown' && entry.key === previous && entry.primaryAction) {
          return entry.primaryAction.label;
        }
      }
    }
    return 'Ny';
  }
  return NAV_CRUMB_MAP[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1));
}

function buildCrumbs(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return [{ label: 'Översikt', href: null as string | null }];
  return segs.map((seg, i) => ({
    label: labelForSegment(seg, segs[i - 1]),
    href: i < segs.length - 1 ? `/${segs.slice(0, i + 1).join('/')}` : null,
  }));
}

// ─── Context-aware topbar CTA ─────────────────────────────────────────────────

function getPrimaryAction(pathname: string, navConfig = NAV_CONFIG): { href: string; label: string } | null {
  for (const section of navConfig) {
    for (const entry of section.items) {
      if (!entry.primaryAction) continue;
      if (entry.type === 'link') {
        const active = entry.exact
          ? pathname === entry.href
          : pathname === entry.href || pathname.startsWith(entry.href + '/');
        if (active) return entry.primaryAction;
      } else {
        // Dropdown: match by the top-level path prefix of its children
        const prefix = entry.items[0]?.href.split('/').filter(Boolean)[0];
        if (prefix && (pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`))) {
          return entry.primaryAction;
        }
      }
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  user: User;
  children: React.ReactNode;
  enabledModules?: string[];
  brand?: ShellBrand;
}

const LS_KEY = 'sidebar-collapsed';

export default function AppShell({ user, children, enabledModules = [], brand }: Props) {
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
  const navConfig = getNavConfigForModules(enabledModules);
  const primaryAction = getPrimaryAction(pathname, navConfig);
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
        <SearchTrigger userRole={user.role} />
        <Link
          href="/installningar/notifieringar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          aria-label="Notifieringar"
        >
          <Bell size={18} strokeWidth={1.75} />
        </Link>
        {primaryAction && (
          <Link
            href={primaryAction.href}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--ui-accent)] px-3 text-sm font-semibold text-[var(--ui-text-inverse)] transition-colors hover:bg-[var(--ui-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          >
            <PlusIcon size={14} />
            {primaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div data-brand={brand?.key} className="flex h-dvh overflow-hidden bg-[var(--ui-bg)]">
      <div className="hidden h-full md:flex">
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onLogout={handleLogout}
          enabledModules={enabledModules}
          brand={brand}
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
          enabledModules={enabledModules}
          brand={brand}
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
            {brand && !brand.isPlatform ? (
              <div className="flex items-center gap-2">
                <OrgBrandMark brandKey={brand.key} name={brand.name} isPlatform={brand.isPlatform} size={22} />
                <span className="font-heading text-sm font-semibold text-[var(--ui-text)]">{brand.name}</span>
              </div>
            ) : (
              <BrandLockup size={22} className="gap-2" textClassName="font-heading text-sm text-[var(--ui-text)]" />
            )}
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
