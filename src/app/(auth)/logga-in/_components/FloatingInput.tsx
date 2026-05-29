'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@shared/lib/utils';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelIcon?: ReactNode;
  error?: boolean;
  trailing?: ReactNode;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput(
    { label, labelIcon, error, trailing, id, value, defaultValue, className, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const filled =
      (typeof value === 'string' && value.length > 0) ||
      (typeof defaultValue === 'string' && defaultValue.length > 0);

    return (
      <div
        className="auth-field"
        data-filled={filled ? 'true' : 'false'}
        data-error={error ? 'true' : 'false'}
        data-has-trailing={trailing ? 'true' : 'false'}
      >
        <label htmlFor={inputId} className="auth-field-label">
          {labelIcon ? (
            <span className="auth-field-label__icon" aria-hidden="true">
              {labelIcon}
            </span>
          ) : null}
          {label}
        </label>
        <div className="auth-input-shell">
          <input
            ref={ref}
            id={inputId}
            className={cn('auth-input', className)}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error || undefined}
            {...rest}
          />
          {trailing}
        </div>
      </div>
    );
  },
);
