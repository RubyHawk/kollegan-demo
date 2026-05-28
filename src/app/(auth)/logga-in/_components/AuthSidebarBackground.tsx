'use client';

export function AuthSidebarBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep purple-black base (#1a1126) */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--auth-bg-base)' }}
      />

      {/* Brand navy-teal highlight (#142f45) from top-left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 55% at 10% 12%, oklch(0.22 0.05 242 / 0.95) 0%, transparent 60%)',
        }}
      />

      {/* Brand mid-purple swell from lower-right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 40% at 92% 82%, oklch(0.20 0.08 278 / 0.80) 0%, transparent 60%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/auth/noise.png)',
          backgroundRepeat: 'repeat',
          opacity: 0.045,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{
          background:
            'linear-gradient(to top, oklch(0.10 0.05 295 / 0.90) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
