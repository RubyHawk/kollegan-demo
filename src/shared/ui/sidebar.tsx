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

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@shared/ui/tooltip';
import {
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FileTextIcon,
  ReceiptIcon,
  PackageIcon,
} from '@shared/ui/icons';
import { SPRING_SNAPPY, SPRING_STANDARD, EASE_SPRING } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

interface NavLink {
  type: 'link';
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
  badge?: number;
  adminOnly?: boolean;
}

interface NavDropdown {
  type: 'dropdown';
  key: string;
  label: string;
  icon: IconComponent;
  adminOnly?: boolean;
  items: Array<{ href: string; label: string; adminOnly?: boolean }>;
}

type NavEntry = NavLink | NavDropdown;

interface NavSection {
  section: string;
  items: NavEntry[];
  adminOnly?: boolean;
}

interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onMobileClose?: () => void;
}

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV_CONFIG: NavSection[] = [
  {
    section: 'Offertsystem',
    items: [
      {
        type: 'dropdown',
        key: 'offers',
        label: 'Offerter',
        icon: ReceiptIcon,
        items: [
          { href: '/offers',     label: 'Alla offerter' },
          { href: '/offers/new', label: 'Ny offert' },
        ],
      },
      { type: 'link', href: '/templates', label: 'Mallar',         icon: FileTextIcon },
      { type: 'link', href: '/products',  label: 'Produktbibliotek', icon: PackageIcon },
    ],
  },
  {
    section: 'Admin',
    adminOnly: true,
    items: [
      { type: 'link', href: '/settings/users', label: 'Användare', icon: UserIcon },
      {
        type: 'dropdown',
        key: 'settings',
        label: 'Inställningar',
        icon: SettingsIcon,
        items: [
          { href: '/settings',         label: 'Allmänt' },
          { href: '/settings/profile', label: 'Profil' },
        ],
      },
    ],
  },
];

// ─── Motion constants ─────────────────────────────────────────────────────────

const labelMotion = {
  variants: {
    hidden: { opacity: 0, x: -6 },
    show:   { opacity: 1, x: 0 },
  },
  initial:    'hidden',
  animate:    'show',
  exit:       'hidden',
  transition: { duration: 0.14, ease: EASE_SPRING },
};

const childItemVariants = {
  hidden: { opacity: 0, x: -6 },
  show:   { opacity: 1, x: 0 },
};

const childContainerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  icon?: IconComponent;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  indent?: boolean;
  itemIndex?: number;
  reducedMotion: boolean;
  onClick?: () => void;
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
  indent,
  reducedMotion,
  onClick,
}: NavItemProps) {
  // ── Collapsed icon-only button ──────────────────────────────────────────────
  if (collapsed) {
    const btn = (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-lg outline-none mx-auto',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--accent)] bg-[var(--accent)]/10'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        )}
      >
        {Icon && <Icon size={16} />}
      </Link>
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  // ── Child item (indented, with dot indicator) ─────────────────────────────
  if (indent) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center pl-[34px] pr-2 py-1.5 rounded-lg text-[13px] outline-none group/child',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--text-primary)] font-medium bg-[var(--surface-hover)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        )}
      >
        {/* Dot indicator */}
        <span
          className={cn(
            'absolute left-[19px] w-[5px] h-[5px] rounded-full transition-colors duration-150',
            active
              ? 'bg-[var(--accent)]'
              : 'bg-[var(--text-muted)]/40 group-hover/child:bg-[var(--text-muted)]',
          )}
        />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  // ── Regular expanded nav item ───────────────────────────────────────────────
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 w-full px-2 py-1.5 rounded-lg text-[13px] outline-none group/navitem',
        'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'transition-colors duration-150',
        active
          ? 'text-[var(--text-primary)] font-medium bg-[var(--surface-hover)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
      )}
    >
      {/* Bare icon */}
      {Icon && (
        <Icon size={16} className={cn(
          'shrink-0 transition-colors duration-150',
          active
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-muted)] group-hover/navitem:text-[var(--text-secondary)]',
        )} />
      )}

      {/* Label */}
      <AnimatePresence initial={false}>
        <motion.span
          key="label"
          className="flex-1 truncate"
          {...(reducedMotion ? {} : labelMotion)}
        >
          {label}
        </motion.span>
      </AnimatePresence>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10.5px] font-semibold flex items-center justify-center leading-none"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_SNAPPY, delay: 0.1 }}
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </Link>
  );
}

// ─── NavDropdown ──────────────────────────────────────────────────────────────

interface NavDropdownProps {
  entry: NavDropdown;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  itemIndex?: number;
  reducedMotion: boolean;
  onMobileClose?: () => void;
}

function NavDropdownItem({
  entry,
  collapsed,
  open,
  onToggle,
  pathname,
  reducedMotion,
  onMobileClose,
}: NavDropdownProps) {
  const hasActiveChild = entry.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  );
  const Icon = entry.icon;
  const contentId = `nav-dd-${entry.key}`;
  const isHighlighted = hasActiveChild || open;

  // ── Collapsed mode: navigate to first child ───────────────────────────────
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={entry.items[0]?.href ?? '#'}
            onClick={onMobileClose}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-lg outline-none mx-auto',
              'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              'transition-colors duration-150',
              hasActiveChild
                ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
            )}
          >
            <Icon size={16} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{entry.label}</TooltipContent>
      </Tooltip>
    );
  }

  // ── Expanded mode ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Trigger */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          'relative flex items-center gap-3 w-full px-2 py-1.5 rounded-lg text-[13px] outline-none group/ddtrigger',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          isHighlighted
            ? 'text-[var(--text-primary)] font-medium bg-[var(--surface-hover)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        )}
      >
        {/* Bare icon */}
        <Icon size={16} className={cn(
          'shrink-0 transition-colors duration-150',
          isHighlighted
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-muted)] group-hover/ddtrigger:text-[var(--text-secondary)]',
        )} />

        {/* Label */}
        <AnimatePresence initial={false}>
          <motion.span
            key="dd-label"
            className="flex-1 truncate text-left"
            {...(reducedMotion ? {} : labelMotion)}
          >
            {entry.label}
          </motion.span>
        </AnimatePresence>

        {/* Rotating chevron — right arrow rotates to point down */}
        <motion.span
          className="shrink-0 text-[var(--text-muted)]"
          animate={reducedMotion ? undefined : { rotate: open ? 90 : 0 }}
          transition={SPRING_SNAPPY}
        >
          <ChevronRightIcon size={12} />
        </motion.span>
      </button>

      {/* Children — indented, staggered */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            role="group"
            aria-label={entry.label}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: EASE_SPRING }}
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              className="relative mt-0.5 mb-0.5 flex flex-col gap-px"
              variants={reducedMotion ? undefined : childContainerVariants}
              initial="hidden"
              animate="show"
            >
              {/* Vertical tree line */}
              <span className="absolute left-[21px] top-1 bottom-1 w-px bg-[var(--border)]" />
              {(() => {
              // Find the best (most specific) matching child so short
              // prefixes like "/crm" don't false-match "/crm/contacts"
              const bestMatch = entry.items.reduce<string | null>((best, c) => {
                const matches = pathname === c.href || pathname.startsWith(c.href + '/');
                if (matches && (best === null || c.href.length > best.length)) return c.href;
                return best;
              }, null);
              return entry.items.map((child, childIdx) => {
                const childActive = child.href === bestMatch;
                return (
                  <motion.div
                    key={child.href}
                    variants={reducedMotion ? undefined : childItemVariants}
                    transition={SPRING_STANDARD}
                  >
                    <NavItem
                      href={child.href}
                      label={child.label}
                      active={childActive}
                      collapsed={false}
                      indent
                      itemIndex={childIdx}
                      reducedMotion={reducedMotion}
                      onClick={onMobileClose}
                    />
                  </motion.div>
                );
              });
            })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SectionGroup ─────────────────────────────────────────────────────────────

interface SectionGroupProps {
  section: NavSection;
  collapsed: boolean;
  openDropdowns: string[];
  onToggleDropdown: (key: string) => void;
  pathname: string;
  userRole: string;
  reducedMotion: boolean;
  onMobileClose?: () => void;
  isFirst: boolean;
}

function SectionGroup({
  section,
  collapsed,
  openDropdowns,
  onToggleDropdown,
  pathname,
  userRole,
  reducedMotion,
  onMobileClose,
  isFirst,
}: SectionGroupProps) {
  const visibleItems = section.items.filter(
    (item) => !item.adminOnly || userRole === 'admin',
  );
  if (visibleItems.length === 0) return null;

  return (
    <nav
      aria-label={section.section}
      className={cn(
        'flex flex-col gap-0.5',
        !isFirst && 'mt-4 pt-1',
        collapsed && 'items-center',
      )}
    >
      {/* Section label */}
      {!collapsed ? (
        <AnimatePresence initial={false}>
          <motion.div
            key="sec-label"
            className="px-2 mb-1"
            {...(reducedMotion ? {} : { ...labelMotion })}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] select-none whitespace-nowrap">
              {section.section}
            </span>
          </motion.div>
        </AnimatePresence>
      ) : (
        !isFirst && (
          <span className="w-5 h-px bg-[var(--border-light)] rounded-full my-1" />
        )
      )}

      {visibleItems.map((entry, idx) => {
        if (entry.type === 'link') {
          return (
            <NavItem
              key={entry.href}
              href={entry.href}
              label={entry.label}
              icon={entry.icon}
              active={
                entry.exact
                  ? pathname === entry.href
                  : pathname === entry.href || pathname.startsWith(entry.href + '/')
              }
              collapsed={collapsed}
              badge={entry.badge}
              itemIndex={idx}
              reducedMotion={reducedMotion}
              onClick={onMobileClose}
            />
          );
        }
        return (
          <NavDropdownItem
            key={entry.key}
            entry={entry}
            collapsed={collapsed}
            open={openDropdowns.includes(entry.key)}
            onToggle={() => onToggleDropdown(entry.key)}
            pathname={pathname}
            itemIndex={idx}
            reducedMotion={reducedMotion}
            onMobileClose={onMobileClose}
          />
        );
      })}
    </nav>
  );
}

// ─── SidebarHeader ────────────────────────────────────────────────────────────

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function SidebarHeader({ collapsed, onToggleCollapse }: SidebarHeaderProps) {
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
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="white" strokeWidth="1.75"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Soleria sun: circle with cross + rays */}
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2"  y1="12" x2="5"  y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93"  x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93"  x2="17.66" y2="6.34" />
          <line x1="6.34"  y1="17.66" x2="4.93"  y2="19.07" />
        </svg>
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

function SidebarFooter({
  user,
  collapsed,
  onLogout,
  onMobileClose,
}: SidebarFooterProps) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Collapsed footer ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="py-3 flex flex-col items-center gap-1.5 border-t border-[var(--border)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              onClick={onMobileClose}
              className="w-9 h-9 rounded-lg hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[var(--accent)]/15 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              aria-label="Log out"
              className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
            >
              <LogOutIcon size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // ── Expanded footer — flat layout ──────────────────────────────────────────
  return (
    <div className="px-3 py-3 border-t border-[var(--border)] flex flex-col gap-2">
      {/* User identity row */}
      <Link
        href="/settings"
        onClick={onMobileClose}
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 hover:bg-[var(--surface-hover)] transition-colors group"
      >
        <div className="w-7 h-7 rounded-md bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
            {displayName}
          </p>
        </div>
        <SettingsIcon
          size={13}
          className="text-[var(--text-muted)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
        />
      </Link>

      {/* Quick actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onLogout}
          aria-label="Log out"
          className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
        >
          <LogOutIcon size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar (main export) ────────────────────────────────────────────────────

const LS_DROPDOWNS_KEY = 'sidebar-open-dropdowns';

export default function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
  onLogout,
  onMobileClose,
}: SidebarProps) {
  const pathname      = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [mounted, setMounted]             = useState(false);

  // Defer active-state computation to client to avoid SSR/client pathname mismatch
  useEffect(() => { setMounted(true); }, []);

  // Restore dropdown state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_DROPDOWNS_KEY);
      if (stored) setOpenDropdowns(JSON.parse(stored) as string[]);
    } catch { /* ignore */ }
  }, []);

  // Auto-open dropdown if current route is a child
  useEffect(() => {
    const keysToOpen: string[] = [];
    for (const section of NAV_CONFIG) {
      for (const entry of section.items) {
        if (
          entry.type === 'dropdown' &&
          entry.items.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + '/'),
          )
        ) {
          keysToOpen.push(entry.key);
        }
      }
    }
    if (keysToOpen.length > 0) {
      setOpenDropdowns((prev) => Array.from(new Set([...prev, ...keysToOpen])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          <SidebarHeader collapsed={collapsed} onToggleCollapse={onToggleCollapse} />

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
                openDropdowns={openDropdowns}
                onToggleDropdown={toggleDropdown}
                pathname={mounted ? pathname : ''}
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
