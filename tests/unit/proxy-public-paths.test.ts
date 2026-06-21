import { describe, expect, it } from 'vitest';
import {
  config,
  isFluffysHost,
  isFluffysConstructionPath,
  isPortalSurfaceBlockedPath,
  isPublicPath,
  isPublicSurfacePath,
  shouldRewriteFluffysConstruction,
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
    expect(isPublicPath('/fluffys-under-construction')).toBe(true);
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
    expect(isPublicSurfacePath('/fluffys-under-construction')).toBe(true);
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

  it('takes over every Fluffy public and portal route with construction mode only on Fluffy hosts', () => {
    expect(isFluffysConstructionPath('/fluffys-under-construction')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/', 'fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/meny', 'fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/api/v1/public-site/orders', 'fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/logga-in', 'portal.fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/kassa', 'portal.fluffys.se')).toBe(true);
    expect(shouldRewriteFluffysConstruction('/fluffys-under-construction', 'portal.fluffys.se')).toBe(false);
    expect(shouldRewriteFluffysConstruction('/favicon.ico', 'portal.fluffys.se')).toBe(false);
    expect(shouldRewriteFluffysConstruction('/meny', 'offert.soleria.se')).toBe(false);
    expect(shouldRewriteFluffysConstruction('/offerter/publik/token', 'offert.soleria.se')).toBe(false);
  });
});
