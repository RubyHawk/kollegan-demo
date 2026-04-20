import { fetchWithRefresh } from '../api-client';

async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/problem+json')) {
      const problem = await response.json() as { detail?: string; title?: string };
      return problem.detail ?? problem.title ?? fallback;
    }

    if (contentType.includes('application/json')) {
      const json = await response.json() as {
        detail?: string;
        title?: string;
        error?: string | { message?: string };
        message?: string;
      };
      const errorMessage = typeof json.error === 'string' ? json.error : json.error?.message;
      return json.detail ?? json.title ?? errorMessage ?? json.message ?? fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function loadReportRows(endpoint: string): Promise<Record<string, unknown>[]> {
  const res = await fetchWithRefresh(endpoint);
  if (!res.ok) throw new Error(await readApiError(res, `Fel ${res.status}`));

  const json = await res.json() as Record<string, unknown>;
  const envelope = (json.data as Record<string, unknown> | undefined) ?? json;
  let rows: Record<string, unknown>[] = [];
  for (const val of Object.values(envelope)) {
    if (Array.isArray(val)) {
      rows = val as Record<string, unknown>[];
      break;
    }
  }

  return rows.length > 0 ? rows : [envelope];
}
