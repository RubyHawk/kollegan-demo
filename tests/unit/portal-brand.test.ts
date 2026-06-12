import { describe, expect, it } from 'vitest';

import { resolvePortalBrand } from '../../src/modules/generic/branding/portal-brand';

describe('resolvePortalBrand', () => {
  it('returns the platform brand when no tenant resolves', () => {
    const brand = resolvePortalBrand(null);
    expect(brand.key).toBe('platform');
    expect(brand.name).toBe('Soleria');
  });

  it('returns the platform brand for tenants without a brand preset', () => {
    const brand = resolvePortalBrand({ organizationSlug: 'soleria', organizationName: 'Soleria AB' });
    expect(brand.key).toBe('platform');
    expect(brand.name).toBe('Soleria');
  });

  it("returns the Fluffy's brand for the fluffys tenant", () => {
    const brand = resolvePortalBrand({ organizationSlug: 'fluffys', organizationName: "Fluffy's" });
    expect(brand.key).toBe('fluffys');
    expect(brand.name).toBe("Fluffy's");
    expect(brand.workspaceLabel).toBe('Personalportal');
    expect(brand.highlights.length).toBeGreaterThan(0);
  });

  it('prefers the organization display name over the preset name', () => {
    const brand = resolvePortalBrand({
      organizationSlug: 'fluffys',
      organizationName: "Fluffy's Subs & Pizza",
    });
    expect(brand.key).toBe('fluffys');
    expect(brand.name).toBe("Fluffy's Subs & Pizza");
  });

  it('falls back to the preset name when the organization name is blank', () => {
    const brand = resolvePortalBrand({ organizationSlug: 'fluffys', organizationName: '   ' });
    expect(brand.name).toBe("Fluffy's");
  });
});
