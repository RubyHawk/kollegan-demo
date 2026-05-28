'use client';

import { MotionConfig } from 'framer-motion';
import { AuthSidebar } from './AuthSidebar';
import { LoginForm } from './LoginForm';

interface LoginShellProps {
  redirect: string;
}

export function LoginShell({ redirect }: LoginShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="auth-scope flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10"
        style={{ background: 'var(--auth-bg-base)' }}
      >
        <div
          className="flex w-full max-w-[1080px] overflow-hidden rounded-2xl"
          style={{
            boxShadow:
              '0 0 0 1px oklch(1 0 0 / 0.07), 0 40px 100px -16px oklch(0 0 0 / 0.65)',
          }}
        >
          <AuthSidebar />
          <LoginForm redirect={redirect} />
        </div>
      </div>
    </MotionConfig>
  );
}
