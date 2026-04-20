const AUTH_BASE_URL = '/api/v1/auth';

export type MfaMethod = 'totp' | 'webauthn' | 'backup_code';

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export type LoginResult =
  | { status: 'signed_in' }
  | { status: 'mfa_required'; methods: MfaMethod[] };

async function readAuthError(res: Response, fallback: string) {
  try {
    const json = await res.json() as {
      detail?: string;
      error?: string | { message?: string };
      message?: string;
      title?: string;
    };
    const errorMessage = typeof json.error === 'string' ? json.error : json.error?.message;
    return json.detail ?? errorMessage ?? json.message ?? json.title ?? fallback;
  } catch {
    return fallback;
  }
}

async function postJson<T>(url: string, body?: unknown, fallback = 'Begäran misslyckades.') {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await readAuthError(res, fallback));
  }

  return res.json() as Promise<T>;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 202) {
    const json = await res.json().catch(() => ({})) as { data?: { methods?: MfaMethod[] } };
    return { status: 'mfa_required', methods: json.data?.methods ?? ['totp'] };
  }

  if (!res.ok) {
    throw new Error(await readAuthError(res, 'Inloggning misslyckades.'));
  }

  return { status: 'signed_in' };
}

export async function verifyMfa(code: string) {
  await postJson(`${AUTH_BASE_URL}/mfa/verify`, { code }, 'Ogiltig kod. Försök igen.');
}

export async function startPasskeyAuthentication() {
  const json = await postJson<{ data: unknown }>(
    `${AUTH_BASE_URL}/webauthn/authenticate/options`,
    undefined,
    'Kunde inte starta passkey-autentisering.',
  );
  return json.data;
}

export async function verifyPasskeyAuthentication(response: unknown) {
  await postJson(
    `${AUTH_BASE_URL}/webauthn/authenticate/verify`,
    response,
    'Passkey-verifiering misslyckades.',
  );
}

export async function register(payload: RegisterPayload) {
  await postJson(`${AUTH_BASE_URL}/register`, payload, 'Registreringen gick inte att slutföra.');
}

export function devLoginUrl(redirect: string) {
  return `${AUTH_BASE_URL}/dev-login?redirect=${encodeURIComponent(redirect)}`;
}
