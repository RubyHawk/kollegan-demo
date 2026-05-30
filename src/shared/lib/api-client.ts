class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_TRANSIENT_ERROR_EVENT = 'soleria:api-transient-error';
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isRetryableRequest(init?: RequestInit): boolean {
  const method = init?.method?.toUpperCase() ?? 'GET';
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function isTransientStatus(status: number): boolean {
  return TRANSIENT_STATUS_CODES.has(status);
}

function emitTransientApiEvent(status: number, message: string, willRetry: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(API_TRANSIENT_ERROR_EVENT, {
    detail: { status, message, willRetry },
  }));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readApiError(res: Response): Promise<string> {
  const fallback = 'Unknown error';
  const contentType = res.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/problem+json')) {
      const problem = await res.json() as { detail?: string; title?: string };
      return problem.detail ?? problem.title ?? fallback;
    }

    if (contentType.includes('application/json')) {
      const json = await res.json() as {
        detail?: string;
        title?: string;
        error?: string | { message?: string };
        message?: string;
        data?: { message?: string };
      };
      const errorMessage = typeof json.error === 'string' ? json.error : json.error?.message;
      return json.detail ?? json.title ?? errorMessage ?? json.message ?? json.data?.message ?? fallback;
    }

    const text = await res.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(res.status, await readApiError(res));
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return undefined as T;
}

// Attempt a silent token refresh. Returns true if the server issued a new `at` cookie.
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

// Wrap a fetch call so that a single 401 triggers a token refresh + one retry.
// Idempotent requests also get one gentle retry for temporary network/API failures.
async function fetchWithRefresh(input: string, init?: RequestInit): Promise<Response> {
  const requestInit: RequestInit = {
    credentials: 'include',
    ...init,
  };
  const retryable = isRetryableRequest(requestInit);

  let res: Response;
  try {
    res = await fetch(input, requestInit);
  } catch (error) {
    if (retryable) {
      emitTransientApiEvent(0, 'Tillfälligt nätverksproblem. Vi försöker igen automatiskt.', true);
      await wait(650);
      return fetch(input, requestInit);
    }
    throw error;
  }

  if (retryable && isTransientStatus(res.status)) {
    emitTransientApiEvent(res.status, 'Tillfälligt nätverksproblem. Vi försöker igen automatiskt.', true);
    await wait(res.status === 429 ? 1200 : 650);
    const retry = await fetch(input, requestInit);
    if (!retry.ok && isTransientStatus(retry.status)) {
      emitTransientApiEvent(retry.status, 'Det gick inte att hämta data just nu. Försök igen om en stund.', false);
    }
    return retry;
  }
  if (!retryable && isTransientStatus(res.status)) {
    emitTransientApiEvent(res.status, 'Tillfälligt serverproblem. Din ändring sparades inte, försök igen.', false);
  }

  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (!refreshed) return res; // let caller throw from the original 401

  return fetch(input, requestInit); // retry once with the new `at` cookie
}

export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRefresh(url, init);
  return handleResponse<T>(res);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetchWithRefresh(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetchWithRefresh(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetchWithRefresh(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchWithRefresh(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(res.status, await readApiError(res));
  }
}

export { ApiError, fetchWithRefresh };
