'use client';

export function AuthSidebarBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--auth-bg-base)' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 15% 15%, oklch(0.30 0.09 258 / 0.9) 0%, transparent 65%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 42% at 90% 80%, oklch(0.28 0.12 245 / 0.7) 0%, transparent 65%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/auth/noise.png)',
          backgroundRepeat: 'repeat',
          opacity: 0.045,
          mixBlendMode: 'overlay',
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{
          background:
            'linear-gradient(to top, oklch(0.12 0.04 255 / 0.85) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
