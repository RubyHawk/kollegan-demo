'use client';

import { MotionConfig } from 'framer-motion';
import { AuthSidebar } from './AuthSidebar';
import { LoginForm } from './LoginForm';
import { SceneWorkflowRail } from './SceneWorkflowRail';

interface LoginShellProps {
  redirect: string;
}

export function LoginShell({ redirect }: LoginShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-scope auth-page-shell">
        <div className="auth-page-shell__backdrop" aria-hidden="true" />
        <div className="auth-shell">
          <AuthSidebar />
          <SceneWorkflowRail />
          <LoginForm redirect={redirect} />
        </div>
      </div>
    </MotionConfig>
  );
}
