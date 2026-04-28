'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // "Failed to find Server Action" means the user has a stale build cached.
    // A hard reload fetches the current build and resolves the mismatch.
    // The sessionStorage guard prevents an infinite reload loop if the new build also fails.
    if (error.message?.includes('Failed to find Server Action')) {
      const key = 'sa_reload_at';
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="sv">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <img src="/soleria-logo.svg" alt="Soleria" width={40} height={40} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            Något gick fel
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', maxWidth: '360px' }}>
            Ett oväntat fel uppstod. Prova att ladda om sidan.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Försök igen
          </button>
        </div>
      </body>
    </html>
  );
}
