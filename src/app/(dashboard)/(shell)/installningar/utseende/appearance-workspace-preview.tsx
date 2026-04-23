'use client';

import { motion } from 'framer-motion';
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
  const vars = dark ? theme.dark : theme.light;

  return (
    <div
      className="overflow-hidden rounded-[24px] border p-3 shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:p-4"
      style={{
        borderColor: vars['--border'],
        background: `linear-gradient(180deg, ${vars['--surface-0']}, ${vars['--surface-1']})`,
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ background: vars['--accent-subtle'], color: vars['--accent'] }}
        >
          Förhandsvisning
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
        >
          {theme.label}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
        >
          {fontLabel}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
        >
          {sizeLabel}
        </span>
      </div>

      <div
        className="overflow-hidden rounded-[22px] border"
        style={{ borderColor: vars['--border'], background: vars['--surface'] }}
      >
        <div
          className="flex items-center justify-between border-b px-3 py-2.5"
          style={{ borderColor: vars['--border'], background: vars['--surface-1'] }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars['--accent'] }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars['--surface-3'] }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars['--surface-3'] }} />
          </div>
          <div
            className="h-2.5 w-20 rounded-full sm:w-24"
            style={{ background: vars['--surface-3'] }}
          />
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-[88px_minmax(0,1fr)]">
          <div
            className="rounded-[18px] border p-2.5"
            style={{ borderColor: vars['--border'], background: vars['--surface-0'] }}
          >
            <div className="space-y-2">
              {['Översikt', 'Offerter', 'Mallar'].map((item, index) => (
                <div
                  key={item}
                  className="rounded-xl px-2 py-1.5 text-[10px] font-medium"
                  style={{
                    background: index === 0 ? vars['--accent-subtle'] : vars['--surface-alt'],
                    color: index === 0 ? vars['--accent'] : vars['--text-secondary'],
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="rounded-[18px] border p-3"
              style={{ borderColor: vars['--border'], background: vars['--surface-0'] }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: vars['--text-muted'] }}
                  >
                    Soleria-offerter
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-semibold"
                    style={{ color: vars['--text-primary'] }}
                  >
                    Arbetsyta som känns lätt och samlad
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-medium"
                  style={{ background: vars['--accent-subtle'], color: vars['--accent'] }}
                >
                  {sizeLabel}
                </span>
              </div>

              <div className="mt-3 grid gap-2.5">
                {[0.36, 0.84, 0.48].map((opacity, index) => (
                  <div
                    key={index}
                    className="rounded-2xl"
                    style={{
                      height: index === 1 ? 54 : 38,
                      background: index === 1 ? vars['--accent'] : vars['--surface-2'],
                      opacity,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 min-[420px]:grid-cols-2">
              <div
                className="rounded-[18px] border p-3"
                style={{ borderColor: vars['--border'], background: vars['--surface-0'] }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: vars['--text-muted'] }}
                >
                  Typografi
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: vars['--text-primary'] }}>
                  {fontLabel}
                </p>
                <p className="mt-1 text-xs" style={{ color: vars['--text-secondary'] }}>
                  Konsekvent och lättläst
                </p>
              </div>

              <div
                className="rounded-[18px] border p-3"
                style={{ borderColor: vars['--border'], background: vars['--surface-0'] }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars['--accent'] }} />
                  <span className="text-xs font-medium" style={{ color: vars['--text-primary'] }}>
                    Accent i fokus
                  </span>
                </div>
                <div className="h-2.5 rounded-full" style={{ background: vars['--surface-2'] }}>
                  <motion.div
                    initial={{ width: '28%' }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: vars['--accent'] }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
