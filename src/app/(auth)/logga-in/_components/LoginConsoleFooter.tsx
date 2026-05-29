'use client';

import { ShieldCheck } from '@phosphor-icons/react';

export function LoginConsoleFooter() {
  return (
    <div className="auth-console-footer">
      <ShieldCheck size={18} weight="duotone" />
      <span>
        Skyddad intern åtkomst för offert, order, planering och montering.
      </span>
    </div>
  );
}
