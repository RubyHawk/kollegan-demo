'use client';

/**
 * Sidebar — modern SaaS/ERP navigation sidebar.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LogOutIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CloseIcon,
} from '@shared/ui/icons';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';
import { BrandMark } from '@shared/ui/brand';
import { TooltipProvider } from '@shared/ui/tooltip';
import { KONTO_ITEMS } from '@shared/nav/settings-config';
import {
  LS_DROPDOWNS_KEY,
  getNavConfigForModules,
  type SidebarProps,
  type User,
} from './sidebar-config';
import { SectionGroup } from './sidebar-navigation';

// ─── SidebarHeader ────────────────────────────────────────────────────────────

interface SidebarHeaderProps {
  collapsed: boolean;
  onMobileClose?: () => void;
}

function SidebarHeader({ collapsed, onMobileClose }: SidebarHeaderProps) {
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
        <BrandMark size={26} alt="" />
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
            Soleria
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

// ─── SidebarFooter ────────────────────────────────────────────────────────────

interface SidebarFooterProps {
  user: User;
  collapsed: boolean;
  onLogout: () => void;
  onMobileClose?: () => void;
}

function AvatarBadge({ user, size }: { user: User; size: 'sm' | 'md' }) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const initials =
    displayName
      .split(' ')
      .map((word) => word?.[0]?.toUpperCase() ?? '')
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?';

  const dim = size === 'md' ? 'w-8 h-8' : 'w-7 h-7';
  const radius = size === 'md' ? 'rounded-lg' : 'rounded-md';
  const text = size === 'md' ? 'text-[11px]' : 'text-[10px]';

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={displayName}
        className={`${dim} ${radius} object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${radius} bg-[var(--ui-accent-subtle)] flex items-center justify-center shrink-0`}
    >
      <span className={`${text} font-semibold text-[var(--ui-accent)]`}>
        {initials}
      </span>
    </div>
  );
}

function SidebarFooter({
  user,
  collapsed,
  onLogout,
  onMobileClose,
}: SidebarFooterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [collapsedPopoverPosition, setCollapsedPopoverPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    super_admin: 'Superadmin',
    helpdesk: 'Helpdesk',
    user: 'Staff',
    manager: 'Manager',
    receptionist: 'Receptionist',
  };

  useEffect(() => {
    if (!popoverOpen) return;

    function onMouseDown(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [popoverOpen]);

  const updateCollapsedPopoverPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) return;

    const panelWidth = 224;
    const viewportPadding = 12;
    const desiredLeft = rect.right + 10;

    setCollapsedPopoverPosition({
      left: Math.max(
        viewportPadding,
        Math.min(desiredLeft, window.innerWidth - panelWidth - viewportPadding),
      ),
      top: rect.top + rect.height / 2,
    });
  }, []);

  useEffect(() => {
    if (!popoverOpen || !collapsed) return;

    const frame = window.requestAnimationFrame(updateCollapsedPopoverPosition);

    window.addEventListener('resize', updateCollapsedPopoverPosition);
    window.addEventListener('scroll', updateCollapsedPopoverPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateCollapsedPopoverPosition);
      window.removeEventListener('scroll', updateCollapsedPopoverPosition, true);
    };
  }, [collapsed, popoverOpen, updateCollapsedPopoverPosition]);

  const popoverPanel = (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.15, ease: EASE_SPRING }}
      className={cn(
        'z-50 w-56 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]',
        collapsed ? 'max-w-[calc(100vw-1.5rem)]' : 'absolute bottom-full mb-2 left-0',
      )}
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[var(--ui-accent-subtle)] flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[var(--ui-accent)]">
                {displayName
                  .split(' ')
                  .map((word) => word?.[0]?.toUpperCase() ?? '')
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-[var(--ui-text)]">
                {displayName}
              </p>

              {user.role ? (
                <span className="shrink-0 rounded-md bg-[var(--ui-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-text-secondary)]">
                  {roleLabel[user.role] ?? user.role}
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)] truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--ui-border)]" />

      <div className="py-1.5 px-1.5">
        {KONTO_ITEMS.map((item) => {
          const ItemIcon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setPopoverOpen(false);
                onMobileClose?.();
              }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
            >
              <ItemIcon size={14} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="h-px bg-[var(--ui-border)]" />

      <div className="py-1.5 px-1.5">
        <button
          type="button"
          onClick={() => {
            setPopoverOpen(false);
            onLogout();
          }}
          className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--ui-danger-text)] transition-colors hover:bg-[var(--ui-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
        >
          <LogOutIcon size={14} className="shrink-0" />
          Logga ut
        </button>
      </div>
    </motion.div>
  );

  const popoverContent = collapsed ? (
    popoverOpen && collapsedPopoverPosition ? (
      createPortal(
        <div
          className="fixed z-[70] pointer-events-none"
          style={{
            left: collapsedPopoverPosition.left,
            top: collapsedPopoverPosition.top,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="pointer-events-auto">{popoverPanel}</div>
        </div>,
        document.body,
      )
    ) : null
  ) : (
    popoverPanel
  );

  if (collapsed) {
    return (
      <div className="relative py-3 flex flex-col items-center gap-1.5 border-t border-[var(--ui-border)]">
        <button
          type="button"
          ref={triggerRef}
          onClick={() => {
            const nextOpen = !popoverOpen;

            if (nextOpen) {
              updateCollapsedPopoverPosition();
            }

            setPopoverOpen(nextOpen);
          }}
          className="w-9 h-9 rounded-md hover:bg-[var(--ui-surface-hover)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
        >
          <AvatarBadge user={user} size="sm" />
        </button>

        <AnimatePresence>{popoverOpen && popoverContent}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-3 border-t border-[var(--ui-border)]">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setPopoverOpen((value) => !value)}
        className="w-full flex items-center gap-2.5 rounded-md px-1 py-1 -mx-1 hover:bg-[var(--ui-surface-hover)] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
      >
        <AvatarBadge user={user} size="md" />

        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-[var(--ui-text)] truncate">
            {displayName}
          </p>

          <p className="text-[11px] text-[var(--ui-text-muted)] truncate">
            {user.email}
          </p>
        </div>

        <ChevronRightIcon
          size={13}
          className={cn(
            'text-[var(--ui-text-muted)] transition-all shrink-0',
            popoverOpen ? 'opacity-60 rotate-90' : 'opacity-0 group-hover:opacity-40',
          )}
        />
      </button>

      <AnimatePresence>{popoverOpen && popoverContent}</AnimatePresence>
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
          <SidebarHeader collapsed={collapsed} onMobileClose={onMobileClose} />

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
            onLogout={onLogout}
            onMobileClose={onMobileClose}
          />
        </aside>
      </div>
    </TooltipProvider>
  );
}
