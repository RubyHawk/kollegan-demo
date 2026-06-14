import Image from 'next/image';
import { cn } from '@shared/lib/utils';
import {
  BRAND_MARK_PATH,
  BRAND_NAME,
  BRAND_SCENE_PATH,
} from '@shared/branding';

interface BrandMarkProps {
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

interface BrandLockupProps extends BrandMarkProps {
  name?: string;
  textClassName?: string;
  align?: 'left' | 'center';
}

export function BrandMark({
  size = 28,
  alt = BRAND_NAME,
  className,
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src={BRAND_MARK_PATH}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn('h-auto w-auto object-contain', className)}
    />
  );
}

export function BrandLockup({
  size = 28,
  alt = BRAND_NAME,
  name = BRAND_NAME,
  className,
  textClassName,
  priority = false,
  align = 'left',
}: BrandLockupProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        align === 'center' && 'justify-center text-center',
        className,
      )}
    >
      <BrandMark size={size} alt={alt} priority={priority} />
      <span className={cn('font-semibold tracking-tight', textClassName)}>
        {name}
      </span>
    </div>
  );
}

/** Per-tenant logo assets, keyed by resolved portal brand key. */
const TENANT_BRAND_MARKS: Record<string, string> = {
  fluffys: '/fluffys/favicon.svg',
};

/**
 * Shell brand mark resolver. Prefers a tenant logo asset (e.g. Fluffy's),
 * falls back to a generated letter mark for other tenants, and the platform
 * mark for the platform brand.
 */
export function OrgBrandMark({
  brandKey,
  name,
  isPlatform,
  size = 26,
  className,
}: {
  brandKey?: string;
  name?: string;
  isPlatform?: boolean;
  size?: number;
  className?: string;
}) {
  const asset = brandKey ? TENANT_BRAND_MARKS[brandKey] : undefined;
  if (asset) {
    return (
      <Image
        src={asset}
        alt=""
        width={size}
        height={size}
        className={cn('rounded-[7px] object-contain', className)}
      />
    );
  }
  if (!isPlatform && name) return <OrgLetterMark name={name} size={size} className={className} />;
  return <BrandMark size={size} alt="" className={className} />;
}

/** Letter-based mark for tenant organizations without a dedicated logo asset. */
export function OrgLetterMark({
  name,
  size = 26,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--ui-accent)] font-bold text-[var(--ui-text-inverse)]',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden="true"
    >
      {(name.trim().charAt(0) || '?').toUpperCase()}
    </span>
  );
}

export function BrandScene({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={BRAND_SCENE_PATH}
      alt=""
      fill
      priority={priority}
      sizes="(min-width: 1024px) 420px, 100vw"
      className={cn('object-cover', className)}
    />
  );
}
