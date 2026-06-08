import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@shared/ui/input';
import { Toolbar, ToolbarGroup, ToolbarSpacer } from '@shared/ui/toolbar';
import { cn } from '@shared/lib/utils';

type FilterBarProps = React.HTMLAttributes<HTMLDivElement> & {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

function FilterBar({ searchValue, onSearchChange, searchPlaceholder = 'Sok', filters, actions, className, ...props }: FilterBarProps) {
  return (
    <Toolbar className={className} {...props}>
      {onSearchChange ? (
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" aria-hidden />
          <Input
            value={searchValue ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      ) : null}
      {filters ? <ToolbarGroup>{filters}</ToolbarGroup> : null}
      <ToolbarSpacer />
      {actions ? <ToolbarGroup className={cn(!onSearchChange && !filters && 'ml-auto')}>{actions}</ToolbarGroup> : null}
    </Toolbar>
  );
}

export { FilterBar };

