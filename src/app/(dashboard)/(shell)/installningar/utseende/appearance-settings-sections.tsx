'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SPRING_SNAPPY } from '@shared/lib/motion';
import { Icon, SaveButton } from '../_components/shared';
import {
  THEMES,
  FONT_OPTIONS,
  type ThemeDef,
  type ThemeMode,
  type FontSize,
  type FontOption,
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


function WorkspacePreview({
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.06)] sm:p-5 lg:p-6"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-start">
          <div className="space-y-3">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Utseende
              </span>
              <div className="space-y-2">
                <h2 className="max-w-3xl text-[2rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.35rem] lg:text-[2.7rem]">
                  Gör arbetsytan lugnare, varmare och tydligare.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  Välj ett uttryck som känns premium utan att störa jobbet. Allt uppdateras direkt, men själva sidan ska också vara snabb att överblicka och lätt att justera.
                </p>
              </div>
            </div>

            <div className="grid gap-2 min-[440px]:grid-cols-3">
              {[
                { label: 'Accent', value: activeTheme.label },
                { label: 'Typsnitt', value: activeFont.label },
                { label: 'Textstorlek', value: activeFontSize.label },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-2.5 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Visningsläge</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
                    Ljust, mörkt eller auto.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  {MODE_OPTIONS.map((mode) => {
                    const active = theme === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => applyTheme(mode.id)}
                        className={cn(
                          'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_10px_22px_rgba(0,0,0,0.05)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{mode.label}</p>
                        </div>
                        <span
                          className={cn(
                            'flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[9px]',
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                              : 'border-[var(--border)] text-[var(--text-muted)]',
                          )}
                        >
                          {active ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="mb-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Textstorlek</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
                    Tät, normal eller luftig.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  {FONT_SIZE_OPTIONS.map((size) => {
                    const active = fontSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => applyFontSize(size.id)}
                        className={cn(
                          'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_10px_22px_rgba(0,0,0,0.05)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{size.label}</p>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold text-[var(--text-primary)]',
                            size.id === 'small' && 'text-sm',
                            size.id === 'medium' && 'text-base',
                            size.id === 'large' && 'text-lg',
                          )}
                        >
                          Aa
                        </span>
                        <span
                          className={cn(
                            'flex h-4.5 w-4.5 items-center justify-center rounded-full border text-[9px]',
                            active
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                              : 'border-[var(--border)] text-[var(--text-muted)]',
                          )}
                        >
                          {active ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:pt-11">
            <WorkspacePreview
              theme={activeTheme}
              dark={resolvedDark}
              fontLabel={activeFont.label}
              sizeLabel={activeFontSize.label}
            />
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.03, ease: 'easeOut' }}
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.06)] sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Accentpaletter</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Kompakta val för färgkänslan. Previewn ovan visar hur den aktiva paletten faktiskt beter sig.
              </p>
            </div>
            <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
              Aktiv: {activeTheme.label}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {THEMES.map((item, index) => {
              const active = item.id === selectedTheme;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => applySelectedTheme(item)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02, ease: 'easeOut' }}
                  className={cn(
                    'relative rounded-[18px] border p-2.5 text-left transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_14px_28px_rgba(0,0,0,0.06)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5 text-[var(--text-primary)]">{item.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{item.desc}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.swatches.slice(0, 4).map((swatch) => (
                      <span
                        key={`${item.id}-${swatch}-dot`}
                        className="h-3.5 w-3.5 rounded-full border border-black/5 shrink-0"
                        style={{ background: swatch }}
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={SPRING_SNAPPY}
                        className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white"
                      >
                        <Icon path={<polyline points="20 6 9 17 4 12" />} size={11} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05, ease: 'easeOut' }}
          className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.06)] sm:p-5"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Typsnitt</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Välj ett tydligt uttryck utan att fylla sidan med stora, onödiga kort.
            </p>
          </div>

          <div className="grid gap-2 min-[420px]:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {FONT_OPTIONS.map((font, index) => {
              const active = font.id === fontFamily;
              return (
                <motion.button
                  key={font.id}
                  type="button"
                  onClick={() => applyFont(font)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.02, ease: 'easeOut' }}
                  className={cn(
                    'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_12px_24px_rgba(0,0,0,0.05)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                  )}
                >
                  <span className="min-w-[28px] text-lg font-medium text-[var(--text-primary)]" style={font.sampleStyle}>
                    Aa
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{font.label}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{font.desc}</p>
                  </div>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border)] text-[var(--text-muted)]',
                    )}
                  >
                    {active ? '✓' : ''}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-0)] px-4 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-[var(--text-muted)]">
          Inställningarna sparas lokalt direkt. Använd knappen om du vill bekräfta ändringen tydligt.
        </p>
        <div className="flex justify-end">
          <SaveButton pending={pending} saved={saved} onClick={save} />
        </div>
      </div>
    </div>
  );
}
