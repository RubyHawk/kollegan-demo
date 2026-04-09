import { shouldLoadThemeProfile } from '@shared/ui/theme-bootstrap';

describe('theme profile loading', () => {
  it('disables auth profile bootstrap on public offer routes', () => {
    expect(shouldLoadThemeProfile('/offerter/publik/token-123')).toBe(false);
  });

  it('keeps auth profile bootstrap enabled on app routes', () => {
    expect(shouldLoadThemeProfile('/offerter')).toBe(true);
    expect(shouldLoadThemeProfile('/dashboard')).toBe(true);
  });
});
