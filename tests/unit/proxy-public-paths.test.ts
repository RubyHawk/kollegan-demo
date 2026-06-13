import { describe, expect, it } from 'vitest';
import {
  config,
  isFluffysHost,
  isPortalSurfaceBlockedPath,
  isPublicPath,
  isPublicSurfacePath,
  shouldRewriteFluffysFavicon,
} from '../../src/proxy';

describe('proxy public path allowlist', () => {
  it('keeps legacy and v1 auth endpoints public for signed-out flows', () => {
    expect(isPublicPath('/logga-in')).toBe(true);
    expect(isPublicPath('/registrera')).toBe(true);
    expect(isPublicPath('/api/auth/login')).toBe(true);
    expect(isPublicPath('/api/v1/auth/login')).toBe(true);
    expect(isPublicPath('/api/v1/auth/mfa/verify')).toBe(true);
    expect(isPublicPath('/api/v1/auth/webauthn/authenticate/options')).toBe(true);
    expect(isPublicPath('/site')).toBe(true);
    expect(isPublicPath('/api/v1/public-site')).toBe(true);
    expect(isPublicPath('/api/v1/public-site/reservations')).toBe(true);
    expect(isPublicPath('/api/health')).toBe(true);
  });

  it('does not make unrelated v1 API routes public', () => {
    expect(isPublicPath('/api/v1/projekt')).toBe(false);
    expect(isPublicPath('/api/v1/companies')).toBe(false);
    expect(isPublicPath('/api/v1/public-site-extra')).toBe(false);
  });

  it('keeps the public runtime surface narrow', () => {
    expect(isPublicSurfacePath('/site/meny')).toBe(true);
    expect(isPublicSurfacePath('/api/v1/public-site/reservations')).toBe(true);
    expect(isPublicSurfacePath('/api/health')).toBe(true);
    expect(isPublicSurfacePath('/logga-in')).toBe(false);
    expect(isPublicSurfacePath('/api/v1/restaurant/menu')).toBe(false);
  });

  it('blocks public-site traffic on the portal runtime surface', () => {
    expect(isPortalSurfaceBlockedPath('/site/meny', 'portal.fluffys.se')).toBe(true);
    expect(isPortalSurfaceBlockedPath('/api/v1/public-site', 'portal.fluffys.se')).toBe(true);
    expect(isPortalSurfaceBlockedPath('/logga-in', 'portal.fluffys.se')).toBe(false);
    expect(isPortalSurfaceBlockedPath('/offerter/publik/token', 'portal.fluffys.se')).toBe(false);
    expect(isPortalSurfaceBlockedPath('/logga-in', 'fluffys.se')).toBe(true);
  });

  it('routes Fluffy hosts to the Fluffy favicon without changing Soleria hosts', () => {
    expect(isFluffysHost('fluffys.se')).toBe(true);
    expect(isFluffysHost('www.fluffys.se')).toBe(true);
    expect(isFluffysHost('portal.fluffys.se')).toBe(true);
    expect(isFluffysHost('offert.soleria.se')).toBe(false);
    expect(shouldRewriteFluffysFavicon('/favicon.ico', 'portal.fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysFavicon('/favicon.ico', 'fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysFavicon('/favicon.ico', 'offert.soleria.se')).toBe(false);
    expect(config.matcher).toContain('/favicon.ico');
  });
});
