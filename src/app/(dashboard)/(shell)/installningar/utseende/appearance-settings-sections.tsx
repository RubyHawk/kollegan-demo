'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { SaveButton } from '../_components/shared';
import { WorkspacePreview } from './appearance-workspace-preview';
import {
  FONT_OPTIONS,
  THEMES,
  type FontOption,
  type FontSize,
  type ThemeDef,
  type ThemeMode,
} from '../_components/theme-data';

export const FONT_SIZE_OPTIONS: { id: FontSize; label: string; desc: string }[] = [
  { id: 'small', label: 'Liten', desc: 'Mer information' },
  { id: 'medium', label: 'Normal', desc: 'Balanserad läsbarhet' },
  { id: 'large', label: 'Stor', desc: 'Lugn och tydlig' },
];

const MODE_OPTIONS: { id: ThemeMode; label: string; desc: string }[] = [
  { id: 'light', label: 'Ljust', desc: 'Rent hela dagen' },
  { id: 'dark', label: 'Mörkt', desc: 'Dämpat fokusläge' },
  { id: 'auto', label: 'Auto', desc: 'Följer enheten' },
];

interface AppearanceSettingsViewProps {
  theme: ThemeMode;
  fontSize: FontSize;
  selectedTheme: string;
  fontFamily: string;
  resolvedDark: boolean;
  pending: boolean;
  saved: boolean;
  activeTheme: ThemeDef;
  activeFont: FontOption;
  activeFontSize: { id: FontSize; label: string; desc: string };
  applyTheme: (theme: ThemeMode) => void;
  applySelectedTheme: (theme: ThemeDef) => void;
  applyFont: (font: FontOption) => void;
  applyFontSize: (fontSize: FontSize) => void;
  save: () => void;
}

function SelectionIndicator({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
        active
          ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
          : 'border-[var(--ui-border)] text-[var(--ui-text-muted)]',
      )}
    >
      {active ? <Check size={12} strokeWidth={2} /> : null}
    </span>
  );
}

function OptionButton({
  active,
  children,
  className,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-[var(--ui-radius-md)] border px-3 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]',
        active
          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
          : 'border-[var(--ui-border)] bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-hover)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AppearanceSettingsView({
  theme,
  fontSize,
  selectedTheme,
  fontFamily,
  resolvedDark,
  pending,
  saved,
  activeTheme,
  activeFont,
  activeFontSize,
  applyTheme,
  applySelectedTheme,
  applyFont,
  applyFontSize,
  save,
}: AppearanceSettingsViewProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Panel padding="lg" className="overflow-hidden">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] xl:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <StatusBadge tone="accent">Utseende</StatusBadge>
                <div className="space-y-1">
                  <h2 className="max-w-3xl text-xl font-semibold text-[var(--ui-text)] sm:text-2xl">
                    Gör arbetsytan lugnare, tydligare och lättare att skanna.
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">
                    Välj tema, typografi och textstorlek utan att lämna inställningarna. Förhandsvisningen visar hur valen känns i en kompakt ERP-yta.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 min-[440px]:grid-cols-3">
                {[
                  { label: 'Accent', value: activeTheme.label },
                  { label: 'Typsnitt', value: activeFont.label },
                  { label: 'Textstorlek', value: activeFontSize.label },
                ].map((item) => (
                  <Panel key={item.label} variant="subtle" padding="sm">
                    <p className="text-xs font-medium text-[var(--ui-text-muted)]">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[var(--ui-text)]">{item.value}</p>
                  </Panel>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Panel padding="sm" className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Visningsläge</p>
                    <p className="text-xs leading-5 text-[var(--ui-text-muted)]">Ljust, mörkt eller auto.</p>
                  </div>
                  <div className="grid gap-1.5">
                    {MODE_OPTIONS.map((mode) => {
                      const active = theme === mode.id;
                      return (
                        <OptionButton
                          key={mode.id}
                          active={active}
                          onClick={() => applyTheme(mode.id)}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[var(--ui-text)]">{mode.label}</span>
                            <span className="block text-xs text-[var(--ui-text-muted)]">{mode.desc}</span>
                          </span>
                          <SelectionIndicator active={active} />
                        </OptionButton>
                      );
                    })}
                  </div>
                </Panel>

                <Panel padding="sm" className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Textstorlek</p>
                    <p className="text-xs leading-5 text-[var(--ui-text-muted)]">Tät, normal eller luftig.</p>
                  </div>
                  <div className="grid gap-1.5">
                    {FONT_SIZE_OPTIONS.map((size) => {
                      const active = fontSize === size.id;
                      return (
                        <OptionButton
                          key={size.id}
                          active={active}
                          onClick={() => applyFontSize(size.id)}
                          className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[var(--ui-text)]">{size.label}</span>
                            <span className="block text-xs text-[var(--ui-text-muted)]">{size.desc}</span>
                          </span>
                          <span
                            className={cn(
                              'font-semibold text-[var(--ui-text)]',
                              size.id === 'small' && 'text-sm',
                              size.id === 'medium' && 'text-base',
                              size.id === 'large' && 'text-lg',
                            )}
                          >
                            Aa
                          </span>
                          <SelectionIndicator active={active} />
                        </OptionButton>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            </div>

            <WorkspacePreview
              theme={activeTheme}
              dark={resolvedDark}
              fontLabel={activeFont.label}
              sizeLabel={activeFontSize.label}
            />
          </div>
        </Panel>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.03, ease: 'easeOut' }}
        >
          <Panel padding="md" className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <h3 className="text-base font-semibold text-[var(--ui-text)]">Accentpaletter</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
                  Kompakta val för färgkänslan. Accent ska främst synas i fokus, valda tillstånd och primära åtgärder.
                </p>
              </div>
              <StatusBadge tone="accent">Aktiv: {activeTheme.label}</StatusBadge>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {THEMES.map((item, index) => {
                const active = item.id === selectedTheme;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: index * 0.015, ease: 'easeOut' }}
                  >
                    <OptionButton
                      active={active}
                      onClick={() => applySelectedTheme(item)}
                      className="relative h-full w-full"
                    >
                      <span className="grid gap-2">
                        <span className="min-w-0 pr-7">
                          <span className="block text-sm font-semibold leading-5 text-[var(--ui-text)]">{item.label}</span>
                          <span className="block text-xs leading-4 text-[var(--ui-text-muted)]">{item.desc}</span>
                        </span>
                        <span className="flex flex-wrap gap-1.5">
                          {item.swatches.slice(0, 4).map((swatch) => (
                            <span
                              key={`${item.id}-${swatch}`}
                              className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--ui-border)]"
                              style={{ backgroundColor: swatch }}
                            />
                          ))}
                        </span>
                      </span>
                      <span className="absolute right-3 top-3">
                        <SelectionIndicator active={active} />
                      </span>
                    </OptionButton>
                  </motion.div>
                );
              })}
            </div>
          </Panel>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.05, ease: 'easeOut' }}
        >
          <Panel padding="md" className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--ui-text)]">Typsnitt</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
                Välj ett tydligt uttryck utan att göra inställningssidan större än arbetet kräver.
              </p>
            </div>

            <div className="grid gap-2 min-[420px]:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {FONT_OPTIONS.map((font, index) => {
                const active = font.id === fontFamily;
                return (
                  <motion.div
                    key={font.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16, delay: index * 0.015, ease: 'easeOut' }}
                  >
                    <OptionButton
                      active={active}
                      onClick={() => applyFont(font)}
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                    >
                      <span className="min-w-7 text-lg font-medium text-[var(--ui-text)]" style={font.sampleStyle}>
                        Aa
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--ui-text)]">{font.label}</span>
                        <span className="block truncate text-xs text-[var(--ui-text-muted)]">{font.desc}</span>
                      </span>
                      <SelectionIndicator active={active} />
                    </OptionButton>
                  </motion.div>
                );
              })}
            </div>
          </Panel>
        </motion.section>
      </div>

      <Panel padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--ui-text-muted)]">
          Inställningarna sparas lokalt direkt. Använd knappen om du vill bekräfta ändringen tydligt.
        </p>
        <div className="flex justify-end">
          <SaveButton pending={pending} saved={saved} onClick={save} />
        </div>
      </Panel>
    </div>
  );
}
