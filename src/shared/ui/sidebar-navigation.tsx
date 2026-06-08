'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { ChevronRightIcon } from '@shared/ui/icons';
import { EASE_SPRING, SPRING_SNAPPY, SPRING_STANDARD } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';
import type { IconComponent, NavDropdown, NavSection } from './sidebar-config';

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
          'focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--ui-accent)] bg-[var(--ui-accent-subtle)]'
            : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
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
          'focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
          'transition-colors duration-150',
          active
            ? 'text-[var(--ui-text)] font-medium bg-[var(--ui-surface-hover)]'
            : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
        )}
      >
        {/* Dot indicator */}
        <span
          className={cn(
            'absolute left-[19px] w-[5px] h-[5px] rounded-full transition-colors duration-150',
            active
              ? 'bg-[var(--ui-accent)]'
              : 'bg-[var(--ui-text-muted)]/40 group-hover/child:bg-[var(--ui-text-muted)]',
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
        'focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        'transition-colors duration-150',
        active
          ? 'text-[var(--ui-text)] font-medium bg-[var(--ui-surface-hover)]'
          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
      )}
    >
      {/* Bare icon */}
      {Icon && (
        <Icon size={16} className={cn(
          'shrink-0 transition-colors duration-150',
          active
            ? 'text-[var(--ui-accent)]'
            : 'text-[var(--ui-text-muted)] group-hover/navitem:text-[var(--ui-text-secondary)]',
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
          className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ui-accent)] text-[var(--ui-text-inverse)] text-[10.5px] font-semibold flex items-center justify-center leading-none"
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

  // ── Collapsed mode: navigate to collapsedHref or first child ────────────
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={entry.collapsedHref ?? entry.items[0]?.href ?? '#'}
            onClick={onMobileClose}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-lg outline-none mx-auto',
              'focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
              'transition-colors duration-150',
              hasActiveChild
                ? 'text-[var(--ui-accent)] bg-[var(--ui-accent-subtle)]'
                : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
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
          'focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
          'transition-colors duration-150',
          isHighlighted
            ? 'text-[var(--ui-text)] font-medium bg-[var(--ui-surface-hover)]'
            : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
        )}
      >
        {/* Bare icon */}
        <Icon size={16} className={cn(
          'shrink-0 transition-colors duration-150',
          isHighlighted
            ? 'text-[var(--ui-accent)]'
            : 'text-[var(--ui-text-muted)] group-hover/ddtrigger:text-[var(--ui-text-secondary)]',
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
          className="shrink-0 text-[var(--ui-text-muted)]"
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
              <span className="absolute left-[21px] top-1 bottom-1 w-px bg-[var(--ui-border)]" />
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

export function SectionGroup({
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
    (item) => !item.adminOnly || userRole === 'admin' || userRole === 'super_admin',
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
            <span className="text-[11px] font-medium uppercase  text-[var(--ui-text-muted)] select-none whitespace-nowrap">
              {section.section}
            </span>
          </motion.div>
        </AnimatePresence>
      ) : (
        !isFirst && (
          <span className="w-5 h-px bg-[var(--ui-border-subtle)] rounded-full my-1" />
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

