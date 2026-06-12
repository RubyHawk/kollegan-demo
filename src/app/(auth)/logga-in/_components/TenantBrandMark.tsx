'use client';

interface TenantBrandMarkProps {
  name: string;
  size?: number;
}

/** Letter-based brand mark for tenant portals without a dedicated logo asset. */
export function TenantBrandMark({ name, size = 34 }: TenantBrandMarkProps) {
  const letter = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <span
      className="auth-tenant-mark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.56) }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
