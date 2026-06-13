import { describe, expect, it } from 'vitest';

import { isPrettyPublicSiteHost, publicSiteHref } from '../../src/app/site/_lib/public-site-data';

describe('public site route links', () => {
  it('uses pretty links only for configured public-site hosts', () => {
    expect(isPrettyPublicSiteHost('fluffys.se')).toBe(true);
    expect(isPrettyPublicSiteHost('www.fluffys.se', 'fluffys.se,www.fluffys.se')).toBe(true);
    expect(isPrettyPublicSiteHost('localhost:3100')).toBe(false);
  });

  it('keeps path-based /site links on non-public hosts', () => {
    expect(publicSiteHref('', '/')).toBe('/');
    expect(publicSiteHref('', '/meny')).toBe('/meny');
    expect(publicSiteHref('/site', '/')).toBe('/site');
    expect(publicSiteHref('/site', '/meny')).toBe('/site/meny');
    expect(publicSiteHref('/site', '/boka')).toBe('/site/boka');
  });
});
