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
            'radial-gradient(72% 55% at 22% 22%, var(--auth-bg-layer-1) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(45% 38% at 88% 88%, oklch(0.32 0.10 258 / 0.55) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/auth/noise.png)',
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 55%, var(--auth-bg-layer-2) 100%)',
        }}
      />
    </div>
  );
}
