'use client';

import { motion } from 'framer-motion';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import type { ThemeDef } from '../_components/theme-data';

export function WorkspacePreview({
  theme,
  dark,
  fontLabel,
  sizeLabel,
}: {
  theme: ThemeDef;
  dark: boolean;
  fontLabel: string;
  sizeLabel: string;
}) {
  const accent = theme.swatches[0] ?? 'var(--ui-accent)';
  const secondary = theme.swatches[1] ?? 'var(--ui-surface-selected)';

  return (
    <Panel padding="sm" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="accent">Förhandsvisning</StatusBadge>
        <StatusBadge tone="neutral">{theme.label}</StatusBadge>
        <StatusBadge tone="neutral">{dark ? 'Mörkt' : 'Ljust'}</StatusBadge>
        <StatusBadge tone="neutral">{fontLabel}</StatusBadge>
        <StatusBadge tone="neutral">{sizeLabel}</StatusBadge>
      </div>

      <div className="overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2.5">
          <div className="flex items-center gap-2">
            {theme.swatches.slice(0, 3).map((swatch) => (
              <span
                key={swatch}
                className="h-2.5 w-2.5 rounded-full border border-[var(--ui-border)]"
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <div className="h-2.5 w-24 rounded-full bg-[var(--ui-surface-hover)]" />
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-[96px_minmax(0,1fr)]">
          <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-2">
            <div className="space-y-1.5">
              {['Översikt', 'Offerter', 'Mallar'].map((item, index) => (
                <div
                  key={item}
                  className="rounded-[var(--ui-radius-sm)] px-2 py-1.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: index === 0 ? secondary : 'var(--ui-surface-subtle)',
                    color: index === 0 ? 'var(--ui-text-inverse)' : 'var(--ui-text-muted)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ui-text-muted)]">Soleria-offerter</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--ui-text)]">
                    Arbetsyta som känns lätt och samlad
                  </p>
                </div>
                <StatusBadge tone="neutral">{sizeLabel}</StatusBadge>
              </div>

              <div className="mt-3 grid gap-2">
                <div className="h-9 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)]" />
                <div className="h-12 rounded-[var(--ui-radius-md)]" style={{ backgroundColor: accent }} />
                <div className="h-9 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)]" />
              </div>
            </div>

            <div className="grid gap-2 min-[420px]:grid-cols-2">
              <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-3">
                <p className="text-xs font-medium text-[var(--ui-text-muted)]">Typografi</p>
                <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{fontLabel}</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Konsekvent och lättläst</p>
              </div>

              <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-xs font-medium text-[var(--ui-text)]">Accent i fokus</span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--ui-surface-subtle)]">
                  <motion.div
                    initial={{ width: '28%' }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
