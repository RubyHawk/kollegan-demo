export type BrowserQueryValue = string | number | boolean | null | undefined;

export function replaceBrowserQuery(updates: Record<string, BrowserQueryValue>) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) {
      url.searchParams.delete(key);
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}
