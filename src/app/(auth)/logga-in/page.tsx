import { headers } from 'next/headers';
import { resolvePortalBrand, type PortalBrand } from '@modules/generic/branding';
import { resolveTenantByHost } from '@modules/supporting/identity';
import { LoginShell } from './_components/LoginShell';
import './_styles/auth-tokens.css';
import './_styles/login-console.css';
import './_styles/login-controls.css';
import './_styles/login-cinematic.css';
import './_styles/login-scene.css';
import './_styles/login-tenant-brand.css';

function sanitizeRedirect(target: string | string[] | undefined): string {
  if (typeof target !== 'string') return '/';
  if (!target.startsWith('/') || target.startsWith('//')) return '/';
  return target;
}

async function resolveLoginBrand(): Promise<PortalBrand> {
  try {
    const headerStore = await headers();
    const tenant = await resolveTenantByHost(headerStore.get('host'));
    return resolvePortalBrand(tenant);
  } catch {
    // Brand resolution must never block login — fall back to platform brand.
    return resolvePortalBrand(null);
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirect = sanitizeRedirect(params.redirect);
  const brand = await resolveLoginBrand();
  return <LoginShell redirect={redirect} brand={brand} />;
}
