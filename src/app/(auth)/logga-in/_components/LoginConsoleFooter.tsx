'use client';

import { ShieldCheck } from '@phosphor-icons/react';

export function LoginConsoleFooter() {
  return (
    <div className="auth-console-footer">
      <ShieldCheck size={17} weight="duotone" />
      <span>Åtkomst för offert, order, planering och montage.</span>
    </div>
  );
}
