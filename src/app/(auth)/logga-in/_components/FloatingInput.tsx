'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  trailing?: ReactNode;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput({ label, error, trailing, id, value, defaultValue, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const filled =
      (typeof value === 'string' && value.length > 0) ||
      (typeof defaultValue === 'string' && defaultValue.length > 0);

    return (
      <div
        className="auth-input-wrapper"
        data-filled={filled ? 'true' : 'false'}
        data-error={error ? 'true' : 'false'}
        data-has-trailing={trailing ? 'true' : 'false'}
      >
        <label htmlFor={inputId} className="auth-floating-label">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className="auth-input"
          value={value}
          defaultValue={defaultValue}
          {...rest}
        />
        {trailing}
      </div>
    );
  },
);
