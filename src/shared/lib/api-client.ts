class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, text);
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
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

// Wrap a fetch call so that a single 401 triggers a token refresh + one retry.
// If the refresh also fails, the original 401 error is re-thrown.
async function fetchWithRefresh(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (!refreshed) return res; // let caller throw from the original 401

  return fetch(input, init); // retry once with the new `at` cookie
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetchWithRefresh(url);
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

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchWithRefresh(url, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, text);
  }
}

export { ApiError };
