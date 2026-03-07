'use client';

/**
 * Sidebar — modern SaaS/ERP navigation sidebar (2026 redesign)
 *
 * Visual design language:
 *  - No item borders — cleaner, less cluttered look
 *  - Alternating row backgrounds (zebra stripe, expanded only)
 *  - Strong accent-colored hover — same for all items, clearly distinct
 *  - Active: left 3px accent bar + accent tinted background
 *  - Collapsed active: strong accent bg (/20) + left accent bar always visible
 *  - Dropdown children connected by a left tree-line (vertical rail + dot)
 *  - Footer as a distinct card surface with an internal divider
 *  - Section labels: small-caps, muted, with a horizontal rule
 *  - Always-visible collapse tab on right border
 *
 * Animations (Framer Motion):
 *  - Active bar: scaleY 0 → 1 spring on navigation
 *  - Active bg: opacity 0 → 1 fade
 *  - Labels: opacity + x slide when sidebar expands/collapses
 *  - Dropdown: height + opacity + stagger children
 *  - Chevron: rotate 0 → 180° spring
 *  - Icon hover: y -1 + slight scale spring
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
  ChevronRightIcon,
  ChevronDownIcon,
  BarChart2Icon,
  FileTextIcon,
  FolderIcon,
  MessageSquareIcon,
  CreditCardIcon,
  ShieldIcon,
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
  itemIndex = 0,
  reducedMotion,
  onClick,
}: NavItemProps) {
  const isEven = itemIndex % 2 === 0;

  // ── Collapsed icon-only button ──────────────────────────────────────────────
  if (collapsed) {
    const btn = (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-xl outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--accent)] bg-[var(--accent)]/20'
            : 'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]',
        )}
      >
        {/* Active bg */}
        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              className="absolute inset-0 rounded-xl bg-[var(--accent)]/12"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={SPRING_STANDARD}
            />
          )}
        </AnimatePresence>

        {/* Left accent bar — always visible when active, even collapsed */}
        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full bg-[var(--accent)]"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
              style={{ originY: '50%' }}
            />
          )}
        </AnimatePresence>

        <span className={cn(
          'relative z-10 w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors duration-150',
          active ? 'bg-[var(--accent)]/25' : '',
        )}>
          {Icon && <Icon size={15} />}
        </span>
      </Link>
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  // ── Child item (indented, no icon, dot + tree-line) ─────────────────────────
  if (indent) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center gap-2 pl-3 pr-3 py-[7px] rounded-lg text-sm outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--accent)] font-medium bg-[var(--accent)]/8'
            : [
                isEven ? 'bg-[var(--surface-3)]/50' : '',
                'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]',
              ].join(' '),
        )}
      >
        {/* Dot indicator */}
        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-150',
          active ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)]/40',
        )} />
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
        'relative flex items-center gap-2.5 w-full px-2 py-[9px] rounded-xl text-sm font-medium outline-none group/navitem',
        'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'transition-colors duration-150',
        active
          ? 'text-[var(--accent)]'
          : [
              isEven ? 'bg-[var(--surface-3)]/60' : '',
              'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]',
            ].join(' '),
      )}
    >
      {/* Active background */}
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            className="absolute inset-0 rounded-xl bg-[var(--accent)]/8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Left accent bar */}
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            className="absolute left-0 top-[18%] bottom-[18%] w-[3px] rounded-full bg-[var(--accent)]"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
            style={{ originY: '50%' }}
          />
        )}
      </AnimatePresence>

      {/* Boxed icon */}
      {Icon && (
        <motion.span
          className={cn(
            'relative z-10 w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0',
            'transition-colors duration-150',
            active
              ? 'bg-[var(--accent)]/15'
              : 'bg-transparent group-hover/navitem:bg-[var(--accent)]/10',
          )}
          whileHover={reducedMotion ? undefined : { y: -1, scale: 1.04 }}
          transition={SPRING_SNAPPY}
        >
          <Icon size={15} />
        </motion.span>
      )}

      {/* Label */}
      <AnimatePresence initial={false}>
        <motion.span
          key="label"
          className="relative z-10 flex-1 truncate"
          {...(reducedMotion ? {} : labelMotion)}
        >
          {label}
        </motion.span>
      </AnimatePresence>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          className="relative z-10 ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center leading-none"
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
  itemIndex = 0,
  reducedMotion,
  onMobileClose,
}: NavDropdownProps) {
  const hasActiveChild = entry.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  );
  const Icon = entry.icon;
  const contentId = `nav-dd-${entry.key}`;
  const isHighlighted = hasActiveChild || open;
  const isEven = itemIndex % 2 === 0;

  // ── Collapsed mode: icon + tooltip ─────────────────────────────────────────
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              'relative flex items-center justify-center w-10 h-10 rounded-xl outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              'transition-colors duration-150',
              hasActiveChild
                ? 'text-[var(--accent)] bg-[var(--accent)]/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]',
            )}
          >
            {hasActiveChild && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-[var(--accent)]/12"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING_STANDARD}
              />
            )}

            {/* Left accent bar in collapsed mode */}
            <AnimatePresence initial={false}>
              {hasActiveChild && (
                <motion.span
                  className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full bg-[var(--accent)]"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0, opacity: 0 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
                  style={{ originY: '50%' }}
                />
              )}
            </AnimatePresence>

            <span className={cn(
              'relative z-10 w-[30px] h-[30px] rounded-lg flex items-center justify-center',
              hasActiveChild ? 'bg-[var(--accent)]/25' : '',
            )}>
              <Icon size={15} />
            </span>
          </button>
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
          'relative flex items-center gap-2.5 w-full px-2 py-[9px] rounded-xl text-sm font-medium outline-none group/ddtrigger',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          'transition-colors duration-150',
          isHighlighted
            ? 'text-[var(--accent)]'
            : [
                isEven ? 'bg-[var(--surface-3)]/60' : '',
                'text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]',
              ].join(' '),
        )}
      >
        {/* Active/open background */}
        <AnimatePresence initial={false}>
          {isHighlighted && (
            <motion.span
              className="absolute inset-0 rounded-xl bg-[var(--accent)]/8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Left bar when a child is active (and group is closed) */}
        <AnimatePresence initial={false}>
          {hasActiveChild && !open && (
            <motion.span
              className="absolute left-0 top-[18%] bottom-[18%] w-[3px] rounded-full bg-[var(--accent)]"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
              style={{ originY: '50%' }}
            />
          )}
        </AnimatePresence>

        {/* Boxed icon */}
        <motion.span
          className={cn(
            'relative z-10 w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0',
            'transition-colors duration-150',
            isHighlighted
              ? 'bg-[var(--accent)]/15'
              : 'bg-transparent group-hover/ddtrigger:bg-[var(--accent)]/10',
          )}
          whileHover={reducedMotion ? undefined : { y: -1, scale: 1.04 }}
          transition={SPRING_SNAPPY}
        >
          <Icon size={15} />
        </motion.span>

        {/* Label */}
        <AnimatePresence initial={false}>
          <motion.span
            key="dd-label"
            className="relative z-10 flex-1 truncate text-left"
            {...(reducedMotion ? {} : labelMotion)}
          >
            {entry.label}
          </motion.span>
        </AnimatePresence>

        {/* Rotating chevron */}
        <motion.span
          className="relative z-10 shrink-0 text-[var(--text-muted)]"
          animate={reducedMotion ? undefined : { rotate: open ? 180 : 0 }}
          transition={SPRING_SNAPPY}
        >
          <ChevronDownIcon size={13} />
        </motion.span>
      </button>

      {/* Children — tree line + staggered items */}
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
              className="mt-0.5 mb-1 ml-[19px] pl-3 flex flex-col gap-0.5 border-l-2 border-[var(--border-light)]"
              variants={reducedMotion ? undefined : childContainerVariants}
              initial="hidden"
              animate="show"
            >
              {entry.items.map((child, childIdx) => {
                const childActive =
                  pathname === child.href ||
                  pathname.startsWith(child.href + '/');
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
              })}
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
        !isFirst && 'mt-5 pt-5 border-t border-[var(--border-light)]',
        collapsed && 'items-center',
      )}
    >
      {/* Section label row */}
      {!collapsed ? (
        <AnimatePresence initial={false}>
          <motion.div
            key="sec-label"
            className="flex items-center gap-2 px-2 mb-1"
            {...(reducedMotion ? {} : { ...labelMotion })}
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[var(--text-muted)] select-none whitespace-nowrap">
              {section.section}
            </span>
            <span className="flex-1 h-px bg-[var(--border-light)]" />
          </motion.div>
        </AnimatePresence>
      ) : (
        !isFirst && (
          <span className="w-4 h-px bg-[var(--border-light)] rounded-full mb-1" />
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

function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center shrink-0 h-[61px]',
        'border-b border-[var(--border)]',
        collapsed ? 'justify-center px-0' : 'px-4 gap-3',
      )}
    >
      {/* Logo mark */}
      <motion.div
        className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0"
        whileHover={{ scale: 1.05, rotate: 3 }}
        transition={SPRING_SNAPPY}
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="white" strokeWidth="1.75"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-4h6v4" />
        </svg>
      </motion.div>

      {/* Wordmark + version pill */}
      {!collapsed && (
        <AnimatePresence initial={false}>
          <motion.div
            key="wordmark"
            className="flex items-center gap-2 min-w-0"
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.14, ease: EASE_SPRING }}
          >
            <span className="font-heading text-[15px] font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
              Kollegan
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] font-bold tracking-wide uppercase shrink-0">
              ERP
            </span>
          </motion.div>
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
  reducedMotion: boolean;
}

function SidebarFooter({
  user,
  collapsed,
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

  // ── Collapsed footer ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="pb-3 pt-2 flex flex-col items-center gap-1.5 border-t border-[var(--border)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              onClick={onMobileClose}
              className="w-10 h-10 rounded-xl hover:bg-[var(--accent)]/10 flex items-center justify-center transition-colors"
            >
              <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-bold text-white">{initials}</span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{displayName}</TooltipContent>
        </Tooltip>

        <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all" />

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
      </div>
    );
  }

  // ── Expanded footer — card design ─────────────────────────────────────────
  return (
    <div className="p-3 border-t border-[var(--border)]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] overflow-hidden">
        {/* User identity row */}
        <Link
          href="/settings"
          onClick={onMobileClose}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors duration-150 group"
        >
          {/* Avatar with gradient */}
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] truncate capitalize mt-0.5">
              {user.role}
            </p>
          </div>

          <SettingsIcon
            size={13}
            className="text-[var(--text-muted)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
          />
        </Link>

        {/* Divider */}
        <div className="border-t border-[var(--border-light)]" />

        {/* Action controls row */}
        <div className="flex items-center px-2 py-1.5 gap-0.5">
          <ThemeToggle className="flex-1 flex items-center justify-center h-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all text-xs gap-1.5" />

          <div className="w-px h-4 bg-[var(--border-light)] shrink-0" />

          <button
            onClick={onLogout}
            aria-label="Log out"
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
          >
            <LogOutIcon size={13} />
            <span>Log out</span>
          </button>
        </div>
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
          collapsed ? 'w-14' : 'w-60',
        )}
      >
        {/* Sidebar panel */}
        <aside className="h-full w-full flex flex-col glass-sidebar border-r border-[var(--border)] overflow-hidden">
          <SidebarHeader collapsed={collapsed} />

          {/* Scrollable nav */}
          <div
            className={cn(
              'flex-1 py-3 flex flex-col overflow-y-auto scrollbar-thin',
              collapsed ? 'px-2' : 'px-2.5',
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
            reducedMotion={reducedMotion}
          />
        </aside>

        {/*
         * Collapse tab — always visible, cuts seamlessly into the sidebar border.
         * No left border: the sidebar's `border-r` becomes the tab's left edge.
         * Rounded only on the right side, giving it a "tab" appearance.
         */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-[12px] z-20',
            'w-[14px] h-8 rounded-r-lg items-center justify-center',
            'bg-[var(--surface)] border-y border-r border-[var(--border)]',
            'text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40',
            'transition-colors duration-150',
          )}
        >
          <motion.span
            className="flex items-center justify-center"
            animate={reducedMotion ? undefined : { rotate: collapsed ? 0 : 180 }}
            transition={SPRING_SNAPPY}
          >
            <ChevronRightIcon size={9} />
          </motion.span>
        </button>
      </div>
    </TooltipProvider>
  );
}
