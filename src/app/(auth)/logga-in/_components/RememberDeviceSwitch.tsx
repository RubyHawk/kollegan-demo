'use client';

import { Check } from '@phosphor-icons/react';
import { useId } from 'react';

interface Props {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

export function RememberDeviceSwitch({ checked, onCheckedChange }: Props) {
  const id = useId();

  return (
    <div className="auth-remember">
      <label htmlFor={id} className="auth-check">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="auth-check-input"
        />
        <span className="auth-check-box" aria-hidden="true">
          <Check size={13} weight="bold" />
        </span>
        <span className="auth-check-label">Kom ihåg mig</span>
      </label>
      <p className="auth-remember-note">
        Behåll enheten betrodd i 30 dagar efter verifierad inloggning.
      </p>
    </div>
  );
}
