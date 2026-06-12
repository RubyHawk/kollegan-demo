'use client';

/**
 * Sidebar — modern SaaS/ERP navigation sidebar.
 */

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CloseIcon,
} from '@shared/ui/icons';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';
import { BrandMark, OrgLetterMark } from '@shared/ui/brand';
import { TooltipProvider } from '@shared/ui/tooltip';
import {
  LS_DROPDOWNS_KEY,
  getNavConfigForModules,
  type ShellBrand,
  type SidebarProps,
} from './sidebar-config';
import { SidebarFooter } from './sidebar-footer';
import { SectionGroup } from './sidebar-navigation';

// ─── SidebarHeader ────────────────────────────────────────────────────────────

interface SidebarHeaderProps {
  collapsed: boolean;
  onMobileClose?: () => void;
  brand?: ShellBrand;
}

function SidebarHeader({ collapsed, onMobileClose, brand }: SidebarHeaderProps) {
  const isTenantBrand = brand ? !brand.isPlatform : false;
  return (
    <div
      className={cn(
        'flex items-center shrink-0 h-14',
        'border-b border-[var(--ui-border)]',
        collapsed ? 'justify-center px-0' : 'px-4 gap-2.5',
      )}
    >
      <motion.div
        className="flex h-7 w-7 shrink-0 items-center justify-center"
        whileHover={{ scale: 1.04 }}
        transition={SPRING_SNAPPY}
      >
        {isTenantBrand && brand ? <OrgLetterMark name={brand.name} size={26} /> : <BrandMark size={26} alt="" />}
      </motion.div>

      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.span
            key="wordmark"
            className="font-heading text-lg font-semibold text-[var(--ui-text)] whitespace-nowrap min-w-0"
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0 },
            }}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.14, ease: EASE_SPRING }}
          >
            {brand?.name ?? 'Soleria'}
          </motion.span>
        </AnimatePresence>
      )}

      {onMobileClose ? (
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Stäng meny"
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 md:hidden"
        >
          <CloseIcon size={16} />
        </button>
      ) : null}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
  onLogout,
  onMobileClose,
  enabledModules = [],
  brand,
}: SidebarProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;

  /**
   * Important:
   * Initial state must be identical on server and first client render.
   * Do NOT read localStorage in the useState initializer.
   */
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  /**
   * Restore persisted dropdowns after hydration.
   * The setState call is deferred so React's set-state-in-effect rule does not complain.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(LS_DROPDOWNS_KEY);

        if (!stored) return;

        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          setOpenDropdowns(parsed);
        }
      } catch {
        // Ignore invalid localStorage data.
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleDropdown(key: string) {
    setOpenDropdowns((previous) => {
      const next = previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key];

      try {
        localStorage.setItem(LS_DROPDOWNS_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage write failures.
      }

      return next;
    });
  }

  const navConfig = getNavConfigForModules(enabledModules);
  const visibleSections = navConfig.filter(
    (section) =>
      !section.adminOnly || user.role === 'admin' || user.role === 'super_admin',
  );

  const routeOpenDropdowns = navConfig.flatMap((section) =>
    section.items.flatMap((entry) =>
      entry.type === 'dropdown' &&
      entry.items.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + '/'),
      )
        ? [entry.key]
        : [],
    ),
  );

  const activeOpenDropdowns = Array.from(
    new Set([...openDropdowns, ...routeOpenDropdowns]),
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative h-full group/sidebar shrink-0',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-[206px]',
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden md:flex items-center justify-center',
            'absolute top-1/2 -translate-y-1/2 -right-3.5 z-10',
            'w-7 h-7 rounded-full',
            'bg-[var(--ui-surface)] border border-[var(--ui-border)]',
            'text-[var(--ui-text-muted)] hover:text-[var(--ui-accent)] hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)]',
            'opacity-0 shadow-sm transition-all duration-150 group-hover/sidebar:opacity-100 focus-visible:opacity-100',
          )}
        >
          {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
        </button>

        <aside className="h-full w-full flex flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)] overflow-hidden">
          <SidebarHeader collapsed={collapsed} onMobileClose={onMobileClose} brand={brand} />

          <div
            className={cn(
              'flex-1 py-2 flex flex-col overflow-y-auto scrollbar-thin',
              collapsed ? 'px-2' : 'px-3',
            )}
          >
            {visibleSections.map((section, idx) => (
              <SectionGroup
                key={section.section}
                section={section}
                collapsed={collapsed}
                openDropdowns={activeOpenDropdowns}
                onToggleDropdown={toggleDropdown}
                pathname={pathname}
                userRole={user.role}
                reducedMotion={reducedMotion}
                onMobileClose={onMobileClose}
                isFirst={idx === 0}
              />
            ))}
          </div>

          <SidebarFooter
            user={user}
            collapsed={collapsed}
            pathname={pathname}
            onLogout={onLogout}
            onMobileClose={onMobileClose}
          />
        </aside>
      </div>
    </TooltipProvider>
  );
}
