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
