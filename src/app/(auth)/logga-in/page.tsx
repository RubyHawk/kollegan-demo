import { LoginShell } from './_components/LoginShell';
import './_styles/auth-tokens.css';

function sanitizeRedirect(target: string | string[] | undefined): string {
  if (typeof target !== 'string') return '/';
  if (!target.startsWith('/') || target.startsWith('//')) return '/';
  return target;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirect = sanitizeRedirect(params.redirect);
  return <LoginShell redirect={redirect} />;
}
