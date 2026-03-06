'use client';

/**
 * Sidebar — modern SaaS/ERP navigation sidebar
 *
 * Architecture:
 *  - Self-contained: owns dropdown open/closed state (persisted to localStorage)
 *  - Receives `collapsed` / `onToggleCollapse` from AppShell so the shell can
 *    also persist + read the collapsed state (breadcrumb topbar needs to know it)
 *  - Fully data-driven via NAV_CONFIG — add a new ERP module with one config entry
 *  - Role-based: sections and items marked `adminOnly` are hidden for non-admins
 *  - Badge support: items can carry a numeric badge (pending approvals, unread, etc.)
 *
 * Sub-components (all local, not exported):
 *  NavItem, NavDropdown, SectionGroup, SidebarHeader, SidebarFooter
 *
 * Animations (Framer Motion):
 *  - Labels: opacity + x fade when expanding/collapsing
 *  - Dropdown children: height + opacity expand/collapse
 *  - Chevron: rotate 0 → 180°
 *  - Icon hover: scale 1.05
 *  Sidebar width is handled by CSS transition in AppShell (no Framer layout reflow)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  BuildingIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BarChart2Icon,
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  CreditCardIcon,
  ShieldIcon,
} from '@shared/ui/icons';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

interface NavLink {
  type: 'link';
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
  /** Show a numeric badge (0 hides it, > 0 shows the count) */
  badge?: number;
  /** Only visible to users with role === 'admin' */
  adminOnly?: boolean;
}

interface NavDropdown {
  type: 'dropdown';
  /** Unique key used for open/closed state tracking */
  key: string;
  label: string;
  icon: IconComponent;
  adminOnly?: boolean;
  items: Array<{
    href: string;
    label: string;
    adminOnly?: boolean;
  }>;
}

type NavEntry = NavLink | NavDropdown;

interface NavSection {
  section: string;
  items: NavEntry[];
  /** Hide the entire section for non-admins */
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

// ─── Navigation config (ERP-scalable) ────────────────────────────────────────
// To add a new module: append one entry here. No component changes needed.

const NAV_CONFIG: NavSection[] = [
  {
    section: 'Main',
    items: [
      { type: 'link', href: '/',          label: 'Dashboard', icon: HomeIcon,     exact: true },
      { type: 'link', href: '/analytics', label: 'Analytics', icon: BarChart2Icon },
      { type: 'link', href: '/reports',   label: 'Reports',   icon: FileTextIcon },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { type: 'link', href: '/projects', label: 'Projects', icon: FolderIcon },
      {
        type: 'dropdown',
        key: 'crm',
        label: 'CRM',
        icon: UsersIcon,
        items: [
          { href: '/crm',          label: 'Customers' },
          { href: '/crm/leads',    label: 'Leads' },
          { href: '/crm/contacts', label: 'Contacts' },
        ],
      },
      { type: 'link', href: '/messages', label: 'Messages', icon: MessageSquareIcon },
    ],
  },
  {
    section: 'Management',
    adminOnly: true,
    items: [
      { type: 'link', href: '/settings/users',   label: 'Users',      icon: UserIcon },
      { type: 'link', href: '/settings/billing', label: 'Billing',    icon: CreditCardIcon },
      {
        type: 'dropdown',
        key: 'settings',
        label: 'Settings',
        icon: SettingsIcon,
        items: [
          { href: '/settings',              label: 'General' },
          { href: '/settings/profile',      label: 'Profile' },
          { href: '/settings/integrations', label: 'Integrations' },
        ],
      },
      { type: 'link', href: '/admin/compliance', label: 'Compliance', icon: ShieldIcon, adminOnly: true },
    ],
  },
  {
    section: 'Demos',
    items: [
      { type: 'link', href: '/demos', label: 'Demos', icon: BuildingIcon },
    ],
  },
];

// ─── Motion helpers ───────────────────────────────────────────────────────────

/** Fade + slide labels in/out when sidebar expands/collapses */
const labelVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

const labelTransition = { duration: 0.15, ease: EASE_SPRING };

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  href: string;
  label: string;
  /** Optional — dropdown child items use an indent-only style with no icon */
  icon?: IconComponent;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  indent?: boolean;
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
  const baseClass = cn(
    'relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150 outline-none',
    'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1',
    collapsed
      ? 'justify-center w-10 h-10'
      : cn('gap-3 w-full', indent ? 'pl-8 pr-3 py-2' : 'px-3 py-2.5'),
    active
      ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
  );

  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={baseClass}
      aria-current={active ? 'page' : undefined}
    >
      {/* Icon with hover scale — omitted for indented dropdown children */}
      {Icon && (
        <motion.span
          className="shrink-0"
          whileHover={reducedMotion ? undefined : { scale: 1.05 }}
          transition={SPRING_SNAPPY}
        >
          <Icon size={indent ? 14 : 16} />
        </motion.span>
      )}

      {/* Label — fades in/out with sidebar expand/collapse */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.span
            key="label"
            className="flex-1 truncate"
            variants={reducedMotion ? undefined : labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={labelTransition}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      )}

      {/* Badge — only shown expanded and when count > 0 */}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );

  // In collapsed mode, wrap in a Tooltip so users know what each icon does
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ─── NavDropdown ──────────────────────────────────────────────────────────────

interface NavDropdownProps {
  entry: NavDropdown;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  pathname: string;
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
  // The parent dropdown is "active" if any child route is active
  const hasActiveChild = entry.items.some((item) => pathname.startsWith(item.href));
  const Icon = entry.icon;
  const contentId = `nav-dropdown-${entry.key}`;

  const triggerClass = cn(
    'relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150',
    'w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1',
    collapsed
      ? 'justify-center w-10 h-10'
      : 'gap-3 px-3 py-2.5',
    hasActiveChild && !open
      ? 'text-[var(--accent)] hover:bg-[var(--accent)]/8'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
    open && !hasActiveChild && 'bg-[var(--surface-hover)] text-[var(--text-primary)]',
  );

  const trigger = (
    <button
      onClick={onToggle}
      className={triggerClass}
      aria-expanded={open}
      aria-controls={collapsed ? undefined : contentId}
    >
      {/* Icon */}
      <motion.span
        className="shrink-0"
        whileHover={reducedMotion ? undefined : { scale: 1.05 }}
        transition={SPRING_SNAPPY}
      >
        <Icon size={16} />
      </motion.span>

      {/* Label */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.span
            key="label"
            className="flex-1 truncate text-left"
            variants={reducedMotion ? undefined : labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={labelTransition}
          >
            {entry.label}
          </motion.span>
        </AnimatePresence>
      )}

      {/* Active-child dot indicator when collapsed */}
      {collapsed && hasActiveChild && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
      )}

      {/* Chevron — rotates when open */}
      {!collapsed && (
        <motion.span
          className="shrink-0 text-[var(--text-muted)]"
          animate={reducedMotion ? undefined : { rotate: open ? 180 : 0 }}
          transition={SPRING_SNAPPY}
        >
          <ChevronDownIcon size={13} />
        </motion.span>
      )}
    </button>
  );

  // In collapsed mode, the dropdown just shows a tooltip with the group name;
  // users navigate via the top-level link in the group (first child) if needed.
  // Full popover menus would require @radix-ui/react-popover — keeping it simple
  // for now and just labelling the icon. Can be upgraded to Popover in a future pass.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right">{entry.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      {trigger}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            role="group"
            aria-label={entry.label}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_SPRING }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-0.5 pb-1 flex flex-col gap-0.5">
              {entry.items.map((child) => (
                <NavItem
                  key={child.href}
                  href={child.href}
                  label={child.label}
                  // No icon — indented child items rely on pl-8 for visual hierarchy
                  active={pathname === child.href || pathname.startsWith(child.href + '/')}
                  collapsed={false}
                  indent
                  reducedMotion={reducedMotion}
                  onClick={onMobileClose}
                />
              ))}
            </div>
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
  // Filter admin-only items
  const visibleItems = section.items.filter(
    (item) => !item.adminOnly || userRole === 'admin',
  );

  if (visibleItems.length === 0) return null;

  return (
    <nav
      aria-label={section.section}
      className={cn(
        'flex flex-col gap-0.5',
        !isFirst && 'mt-4 pt-4 border-t border-[var(--border)]',
        collapsed ? 'items-center' : '',
      )}
    >
      {/* Section label — hidden when collapsed */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.p
            key="section-label"
            className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] select-none"
            variants={reducedMotion ? undefined : labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={labelTransition}
          >
            {section.section}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Items */}
      {visibleItems.map((entry) => {
        if (entry.type === 'link') {
          return (
            <NavItem
              key={entry.href}
              href={entry.href}
              label={entry.label}
              icon={entry.icon}
              active={entry.exact
                ? pathname === entry.href
                : pathname === entry.href || pathname.startsWith(entry.href + '/')}
              collapsed={collapsed}
              badge={entry.badge}
              reducedMotion={reducedMotion}
              onClick={onMobileClose}
            />
          );
        }

        // type === 'dropdown'
        return (
          <NavDropdownItem
            key={entry.key}
            entry={entry}
            collapsed={collapsed}
            open={openDropdowns.includes(entry.key)}
            onToggle={() => onToggleDropdown(entry.key)}
            pathname={pathname}
            reducedMotion={reducedMotion}
            onMobileClose={onMobileClose}
          />
        );
      })}
    </nav>
  );
}

// ─── SidebarHeader ────────────────────────────────────────────────────────────

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-[var(--border)] shrink-0 h-[61px]',
        collapsed ? 'justify-center' : 'px-5 gap-2.5',
      )}
    >
      {/* Logo mark — identical to current app-shell */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-4h6v4" />
        </svg>
      </div>

      {/* Wordmark fades with sidebar */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.span
            key="wordmark"
            className="font-heading text-base font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={labelTransition}
          >
            Kollegan
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
  onToggleCollapse: () => void;
  onLogout: () => void;
  onMobileClose?: () => void;
  reducedMotion: boolean;
}

function SidebarFooter({
  user,
  collapsed,
  onToggleCollapse,
  onLogout,
  onMobileClose,
  reducedMotion,
}: SidebarFooterProps) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'py-3 border-t border-[var(--border)] flex flex-col gap-1',
        collapsed ? 'px-2 items-center' : 'px-3',
      )}
    >
      {/* Profile row */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              onClick={onMobileClose}
              className="w-10 h-10 rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>
      ) : (
        <Link
          href="/settings"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">{user.role}</p>
          </div>
          <SettingsIcon
            size={13}
            className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </Link>
      )}

      {/* Controls row — theme toggle + logout */}
      <div
        className={cn(
          'flex items-center gap-1 pt-0.5',
          collapsed ? 'flex-col' : 'px-1',
        )}
      >
        <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-all text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                aria-label="Log out"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
              >
                <LogOutIcon size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
          >
            <LogOutIcon size={14} />
            Log out
          </button>
        )}
      </div>

      {/* Collapse toggle — desktop only (hidden on mobile) */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'hidden md:flex items-center justify-center h-7 rounded-lg mt-0.5',
          'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-all',
          collapsed ? 'w-8' : 'w-full gap-1.5',
        )}
      >
        {collapsed ? (
          <ChevronRightIcon size={13} />
        ) : (
          <>
            <ChevronLeftIcon size={13} />
            <motion.span
              className="text-[11px]"
              variants={reducedMotion ? undefined : labelVariants}
              initial="hidden"
              animate="visible"
              transition={labelTransition}
            >
              Collapse
            </motion.span>
          </>
        )}
      </button>
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
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;

  // Which dropdown groups are currently open
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  // Restore dropdown state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_DROPDOWNS_KEY);
      if (stored) setOpenDropdowns(JSON.parse(stored) as string[]);
    } catch {
      // localStorage unavailable (SSR / private browsing) — use empty default
    }
  }, []);

  // Auto-open any dropdown that contains the current active route
  useEffect(() => {
    const keysToOpen: string[] = [];
    for (const section of NAV_CONFIG) {
      for (const entry of section.items) {
        if (
          entry.type === 'dropdown' &&
          entry.items.some((child) => pathname.startsWith(child.href))
        ) {
          keysToOpen.push(entry.key);
        }
      }
    }
    if (keysToOpen.length > 0) {
      setOpenDropdowns((prev) => {
        const next = Array.from(new Set([...prev, ...keysToOpen]));
        return next;
      });
    }
    // Only re-run when pathname changes, not when openDropdowns changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleDropdown(key: string) {
    setOpenDropdowns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      try {
        localStorage.setItem(LS_DROPDOWNS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Filter sections that are admin-only
  const visibleSections = NAV_CONFIG.filter(
    (s) => !s.adminOnly || user.role === 'admin',
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-full flex flex-col glass-sidebar border-r border-[var(--border)]',
          'transition-[width] duration-200 ease-out overflow-hidden',
          collapsed ? 'w-14' : 'w-60',
        )}
      >
        <SidebarHeader collapsed={collapsed} />

        {/* Scrollable nav area */}
        <div
          className={cn(
            'flex-1 py-4 flex flex-col overflow-y-auto',
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
          onToggleCollapse={onToggleCollapse}
          onLogout={onLogout}
          onMobileClose={onMobileClose}
          reducedMotion={reducedMotion}
        />
      </aside>
    </TooltipProvider>
  );
}
