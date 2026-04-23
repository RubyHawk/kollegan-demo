import { resolveProfileThemePreferences, shouldLoadThemeProfile } from '@shared/ui/theme-bootstrap';

describe('theme profile loading', () => {
  it('disables auth profile bootstrap on public offer routes', () => {
    expect(shouldLoadThemeProfile('/offerter/publik/token-123')).toBe(false);
  });

  it('keeps auth profile bootstrap enabled on app routes', () => {
    expect(shouldLoadThemeProfile('/offerter')).toBe(true);
    expect(shouldLoadThemeProfile('/dashboard')).toBe(true);
  });
});

describe('resolveProfileThemePreferences', () => {
  it('prefers explicit user preferences over organization defaults', () => {
    expect(resolveProfileThemePreferences({
      themeMode: 'dark',
      themeAccent: 'forest',
      themeFontFamily: 'manrope',
      themeFontSize: 'large',
      organizationThemeMode: 'light',
      organizationThemeAccent: 'soleria',
      organizationThemeFontFamily: 'inter',
      organizationThemeFontSize: 'medium',
    })).toEqual({
      mode: 'dark',
      accent: 'forest',
      fontFamily: 'manrope',
      fontSize: 'large',
    });
  });

  it('falls back to organization defaults when user preferences are missing', () => {
    expect(resolveProfileThemePreferences({
      themeMode: null,
      themeAccent: null,
      themeFontFamily: null,
      themeFontSize: null,
      organizationThemeMode: 'auto',
      organizationThemeAccent: 'ocean',
      organizationThemeFontFamily: 'fraunces',
      organizationThemeFontSize: 'small',
    })).toEqual({
      mode: 'auto',
      accent: 'ocean',
      fontFamily: 'fraunces',
      fontSize: 'small',
    });
  });

  it('returns an empty preference set when no profile is available', () => {
    expect(resolveProfileThemePreferences(null)).toEqual({});
  });
});
