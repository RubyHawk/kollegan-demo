'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { getVisibleSettings } from '@shared/nav/settings-config';

export default function SettingsNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const sections = getVisibleSettings(userRole);
  const allItems = sections.flatMap((s) => s.items);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Desktop sub-rail — secondary nav, deliberately lighter than the main sidebar:
          icons live on the group title only; items are a text list indented under
          the label on a hairline guide, with the active item marked by an accent bar. */}
      <nav
        aria-label="Inställningar"
        className="hidden w-56 shrink-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)] md:flex md:h-full"
      >
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.key}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <SectionIcon size={14} className="text-[var(--ui-text-muted)]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--ui-text-muted)]">
                    {section.label}
                  </span>
                </div>
                <div className="relative ml-[10px] flex flex-col">
                  <span className="absolute left-0 top-1 bottom-1 w-px bg-[var(--ui-border)]" />
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className="relative rounded-r-md py-[7px] pl-3.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--ui-accent)]" />
                        )}
                        <span
                          className={cn(
                            'transition-colors',
                            active
                              ? 'font-medium text-[var(--ui-accent)]'
                              : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]',
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile — horizontal-scrolling chip row above the content */}
      <nav
        aria-label="Inställningar"
        className="flex gap-2 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2.5 md:hidden"
      >
        {allItems.map((item) => {
          const active = isActive(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]',
              )}
            >
              <ItemIcon size={14} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
