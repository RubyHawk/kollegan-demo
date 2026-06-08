'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { getVisibleSettings } from '@shared/nav/settings-config';

export default function SettingsNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const sections = getVisibleSettings(userRole);
  const allItems = sections.flatMap((s) => s.items);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-48 shrink-0 pr-6 md:block">
        <div className="flex flex-col gap-5">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.key}>
                <div className="mb-1 flex items-center gap-1.5 px-3">
                  <span className="text-[var(--ui-text-muted)]">
                    <SectionIcon size={13} />
                  </span>
                  <p className="text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">
                    {section.label}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const active = pathname === item.href;
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-[var(--ui-accent-subtle)] font-medium text-[var(--ui-accent)]'
                            : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]',
                        )}
                      >
                        <span className={cn('shrink-0', active ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-text-muted)]')}>
                          <ItemIcon size={16} />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile grid */}
      <nav className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3 md:hidden">
        {allItems.map((item) => {
          const active = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--ui-radius-md)] border px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-text)]'
                  : 'border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-subtle)]',
              )}
            >
              <span className={cn('shrink-0', active ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)]')}>
                <ItemIcon size={16} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
