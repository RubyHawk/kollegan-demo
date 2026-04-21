'use client';

/**
 * Sidebar — modern SaaS/ERP navigation sidebar (Linear-inspired redesign)
 *
 * Visual design language:
 *  - Clean, minimal — no icon boxes, no left bars, no tree lines
 *  - Active: surface-hover bg + font-medium + accent icon (Linear-style)
 *  - Hover: surface-hover bg + primary text
 *  - Collapse: hover-reveal button in header
 *  - Section labels: small uppercase, spacing-only separation (no borders)
 *  - Footer: minimal identity row + compact icon buttons
 *
 * Animations (Framer Motion):
 *  - Labels: opacity + x slide when sidebar expands/collapses
 *  - Dropdown: height + opacity + stagger children
 *  - Chevron: rotate 0 → 90° spring
 *  - Badge: subtle pulse on mount
 *  Sidebar width: CSS transition (no Framer layout reflow)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CloseIcon,
} from '@shared/ui/icons';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';
import { BrandMark } from '@shared/ui/brand';
import { TooltipProvider } from '@shared/ui/tooltip';
import { LS_DROPDOWNS_KEY, NAV_CONFIG, type SidebarProps, type User } from './sidebar-config';
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
        'flex items-center shrink-0 h-12',
        'border-b border-[var(--border)]',
        collapsed ? 'justify-center px-0' : 'px-3 gap-2.5',
      )}
    >
      {/* Logo mark */}
      <motion.div
        className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0"
        whileHover={{ scale: 1.04 }}
        transition={SPRING_SNAPPY}
      >
        <BrandMark size={18} alt="" className="brightness-0 invert" />
      </motion.div>

      {/* Wordmark */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.span
            key="wordmark"
            className="font-heading text-[13.5px] font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap min-w-0"
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
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
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden"
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
  // Null-safe initials: take first char of each word, upper-cased, max 2 letters
  const initials = displayName
    .split(' ')
    .map((w) => w?.[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('') || '?';
  // md = expanded footer row (slightly larger); sm = collapsed icon slot
  const dim    = size === 'md' ? 'w-8 h-8' : 'w-7 h-7';
  const radius = size === 'md' ? 'rounded-lg' : 'rounded-md';
  const text   = size === 'md' ? 'text-[11px]' : 'text-[10px]';

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
    <div className={`${dim} ${radius} bg-[var(--accent)]/15 flex items-center justify-center shrink-0`}>
      <span className={`${text} font-semibold text-[var(--accent)]`}>{initials}</span>
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
  const [collapsedPopoverPosition, setCollapsedPopoverPosition] = useState<{ left: number; top: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const roleBadge: Record<string, string> = {
    admin:        'Admin',
    manager:      'Manager',
    receptionist: 'Receptionist',
  };

  // Close on click outside
  useEffect(() => {
    if (!popoverOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPopoverOpen(false);
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
      top: rect.top + (rect.height / 2),
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
        'z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/8',
        collapsed ? 'max-w-[calc(100vw-1.5rem)]' : 'absolute bottom-full mb-2 left-0',
      )}
    >
      {/* User info */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={displayName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[var(--accent)]">
                {displayName.split(' ').map((w) => w?.[0]?.toUpperCase() ?? '').filter(Boolean).slice(0, 2).join('')}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
          </div>
        </div>
        {user.role && (
          <span className="mt-2 inline-flex items-center rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
            {roleBadge[user.role] ?? user.role}
          </span>
        )}
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Quick links */}
      <div className="py-1.5 px-1.5">
        <Link
          href="/installningar/profil"
          onClick={() => { setPopoverOpen(false); onMobileClose?.(); }}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <UserIcon size={14} className="shrink-0" />
          Profil
        </Link>
        <Link
          href="/installningar/utseende"
          onClick={() => { setPopoverOpen(false); onMobileClose?.(); }}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <SettingsIcon size={14} className="shrink-0" />
          Utseende
        </Link>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Logout */}
      <div className="py-1.5 px-1.5">
        <button
          onClick={() => { setPopoverOpen(false); onLogout(); }}
          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] hover:bg-red-500/8 hover:text-red-500 transition-colors"
        >
          <LogOutIcon size={14} className="shrink-0" />
          Logga ut
        </button>
      </div>
    </motion.div>
  );

  const popoverContent = collapsed
    ? (
        popoverOpen && collapsedPopoverPosition
          ? createPortal(
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
          : null
      )
    : popoverPanel;

  // ── Collapsed footer ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="relative py-3 flex flex-col items-center gap-1.5 border-t border-[var(--border)]">
        <button
          ref={triggerRef}
          onClick={() => {
            const nextOpen = !popoverOpen;
            if (nextOpen) updateCollapsedPopoverPosition();
            setPopoverOpen(nextOpen);
          }}
          className="w-9 h-9 rounded-lg hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
        >
          <AvatarBadge user={user} size="sm" />
        </button>
        <AnimatePresence>{popoverOpen && popoverContent}</AnimatePresence>
      </div>
    );
  }

  // ── Expanded footer ────────────────────────────────────────────────────────
  return (
    <div className="relative px-3 py-3 border-t border-[var(--border)]">
      <button
        ref={triggerRef}
        onClick={() => setPopoverOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 hover:bg-[var(--surface-hover)] transition-colors group"
      >
        <AvatarBadge user={user} size="md" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
            {displayName}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {user.email}
          </p>
        </div>
        <ChevronRightIcon
          size={13}
          className={cn(
            'text-[var(--text-muted)] transition-all shrink-0',
            popoverOpen ? 'opacity-60 rotate-90' : 'opacity-0 group-hover:opacity-40',
          )}
        />
      </button>
      <AnimatePresence>{popoverOpen && popoverContent}</AnimatePresence>
    </div>
  );
}

// ─── Sidebar (main export) ────────────────────────────────────────────────────


export default function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
  onLogout,
  onMobileClose,
}: SidebarProps) {
  const pathname      = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LS_DROPDOWNS_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  function toggleDropdown(key: string) {
    setOpenDropdowns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      try { localStorage.setItem(LS_DROPDOWNS_KEY, JSON.stringify(next)); }
      catch { /* ignore */ }
      return next;
    });
  }

  const visibleSections = NAV_CONFIG.filter(
    (s) => !s.adminOnly || user.role === 'admin',
  );
  const routeOpenDropdowns = NAV_CONFIG.flatMap((section) =>
    section.items.flatMap((entry) =>
      entry.type === 'dropdown' &&
      entry.items.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))
        ? [entry.key]
        : [],
    ),
  );
  const activeOpenDropdowns = Array.from(new Set([...openDropdowns, ...routeOpenDropdowns]));

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative h-full group/sidebar shrink-0',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Collapse toggle — centered on sidebar edge, always visible */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden md:flex items-center justify-center',
            'absolute top-1/2 -translate-y-1/2 -right-3.5 z-10',
            'w-7 h-7 rounded-full',
            'bg-[var(--surface)] border border-[var(--border)]',
            'text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 hover:shadow-md',
            'transition-all duration-150',
          )}
        >
          {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
        </button>

        {/* Sidebar panel */}
          <aside className="h-full w-full flex flex-col glass-sidebar border-r border-[var(--border)] overflow-hidden">
          <SidebarHeader collapsed={collapsed} onMobileClose={onMobileClose} />

          {/* Scrollable nav */}
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
