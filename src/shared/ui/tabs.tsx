'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@shared/lib/utils';

// ─── Context ─────────────────────────────────────────────────────────────────

interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}

const TabsCtx = createContext<TabsContextValue | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

// ─── Root ────────────────────────────────────────────────────────────────────

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const set = onValueChange ?? setInternal;

  return (
    <TabsCtx.Provider value={{ value: current, onValueChange: set }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

// ─── TabsList (underline variant) ────────────────────────────────────────────

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-1 overflow-x-auto scrollbar-none', className)}
    >
      {children}
    </div>
  );
}

// ─── TabsTab (single trigger) ────────────────────────────────────────────────

interface TabsTabProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function TabsTab({ value, children, icon, className }: TabsTabProps) {
  const { value: active, onValueChange } = useTabsCtx();
  const isActive = active === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap',
        'transition-colors duration-150 focus:outline-none',
        isActive
          ? 'text-[var(--text-primary)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
        className,
      )}
    >
      {icon && (
        <span className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
        )}>
          {icon}
        </span>
      )}
      {children}
      {/* Underline indicator */}
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-all duration-200',
          isActive
            ? 'bg-[var(--text-primary)]'
            : 'bg-transparent',
        )}
      />
    </button>
  );
}

// ─── TabsPanel ───────────────────────────────────────────────────────────────

interface TabsPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: active } = useTabsCtx();
  if (active !== value) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
