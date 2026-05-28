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
      <div className="auth-scope flex min-h-screen bg-[var(--page-bg)]">
        <AuthSidebar />
        <LoginForm redirect={redirect} />
      </div>
    </MotionConfig>
  );
}
