'use client';

import { useEffect, useMemo, useState } from 'react';
import { FONT_OPTIONS, THEMES, type FontSize, type ThemeMode } from '../_components/theme-data';
import { FieldLabel, SaveButton, SectionCard } from '../_components/shared';
import { getThemeSettings, updateThemeSettings } from '@shared/lib/api/settings.api';
import { FONT_SIZE_OPTIONS } from './appearance-settings-sections';

function SelectField({
  value,
  onChange,
  disabled = false,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 hover:border-[var(--text-muted)]/40 focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:border-[var(--border-light)] disabled:text-[var(--text-muted)]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function OrganizationThemeSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeMode, setThemeMode] = useState('');
  const [themeAccent, setThemeAccent] = useState('');
  const [themeFontFamily, setThemeFontFamily] = useState('');
  const [themeFontSize, setThemeFontSize] = useState('');

  useEffect(() => {
    getThemeSettings()
      .then((settings) => {
        setThemeMode(settings.themeMode ?? '');
        setThemeAccent(settings.themeAccent ?? '');
        setThemeFontFamily(settings.themeFontFamily ?? '');
        setThemeFontSize(settings.themeFontSize ?? '');
        setCanManage(settings.canManage);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const themeModeLabel = useMemo(() => {
    if (!themeMode) return 'Plattformens standard';
    return ({
      light: 'Ljust',
      dark: 'Morkt',
      auto: 'Auto',
    } as const)[themeMode as ThemeMode];
  }, [themeMode]);

  const accentLabel = useMemo(() => {
    if (!themeAccent) return 'Plattformens standard';
    return THEMES.find((theme) => theme.id === themeAccent)?.label ?? themeAccent;
  }, [themeAccent]);

  const fontLabel = useMemo(() => {
    if (!themeFontFamily) return 'Plattformens standard';
    return FONT_OPTIONS.find((font) => font.id === themeFontFamily)?.label ?? themeFontFamily;
  }, [themeFontFamily]);

  const fontSizeLabel = useMemo(() => {
    if (!themeFontSize) return 'Plattformens standard';
    return FONT_SIZE_OPTIONS.find((size) => size.id === themeFontSize)?.label ?? themeFontSize;
  }, [themeFontSize]);

  const handleSave = async () => {
    setPending(true);
    setSaved(false);
    try {
      const updated = await updateThemeSettings({
        themeMode: (themeMode || null) as ThemeMode | null,
        themeAccent: themeAccent || null,
        themeFontFamily: themeFontFamily || null,
        themeFontSize: (themeFontSize || null) as FontSize | null,
      });
      setThemeMode(updated.themeMode ?? '');
      setThemeAccent(updated.themeAccent ?? '');
      setThemeFontFamily(updated.themeFontFamily ?? '');
      setThemeFontSize(updated.themeFontSize ?? '');
      setCanManage(updated.canManage);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore background save failures
    } finally {
      setPending(false);
    }
  };

  return (
    <SectionCard
      title="Organisationsstandard"
      description="Valen här blir standard för interna användare som inte har satt ett eget utseende. Personliga val går alltid före."
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel description="Lagg en org-standard eller lamna tomt for plattformens standard.">
                Visningslage
              </FieldLabel>
              <SelectField
                value={themeMode}
                onChange={setThemeMode}
                disabled={!canManage}
                options={[
                  { value: '', label: 'Plattformens standard' },
                  { value: 'light', label: 'Ljust' },
                  { value: 'dark', label: 'Morkt' },
                  { value: 'auto', label: 'Auto' },
                ]}
              />
            </div>

            <div>
              <FieldLabel description="Accentpaletten som blir forvald nar anvandaren inte valt egen.">
                Accent
              </FieldLabel>
              <SelectField
                value={themeAccent}
                onChange={setThemeAccent}
                disabled={!canManage}
                options={[
                  { value: '', label: 'Plattformens standard' },
                  ...THEMES.map((theme) => ({ value: theme.id, label: theme.label })),
                ]}
              />
            </div>

            <div>
              <FieldLabel description="Typsnitt som blir org-standard for appen.">
                Typsnitt
              </FieldLabel>
              <SelectField
                value={themeFontFamily}
                onChange={setThemeFontFamily}
                disabled={!canManage}
                options={[
                  { value: '', label: 'Plattformens standard' },
                  ...FONT_OPTIONS.map((font) => ({ value: font.id, label: font.label })),
                ]}
              />
            </div>

            <div>
              <FieldLabel description="Textstorleken som anvands som default i arbetsytan.">
                Textstorlek
              </FieldLabel>
              <SelectField
                value={themeFontSize}
                onChange={setThemeFontSize}
                disabled={!canManage}
                options={[
                  { value: '', label: 'Plattformens standard' },
                  ...FONT_SIZE_OPTIONS.map((size) => ({ value: size.id, label: size.label })),
                ]}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Aktiv org-standard
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Visningslage', value: themeModeLabel },
                { label: 'Accent', value: accentLabel },
                { label: 'Typsnitt', value: fontLabel },
                { label: 'Textstorlek', value: fontSizeLabel },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {canManage ? (
            <SaveButton pending={pending} saved={saved} onClick={handleSave} />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Bara personal kan uppdatera organisationsstandarden. Dina personliga val ovan fortsatter att galla for dig.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
