'use client';

import { MotionConfig } from 'framer-motion';
import { useState } from 'react';
import { AuthSidebar } from './AuthSidebar';
import { LoginCinematicOverlay } from './LoginCinematicOverlay';
import { LoginForm } from './LoginForm';

interface LoginShellProps {
  redirect: string;
}

export function LoginShell({ redirect }: LoginShellProps) {
  const [cinematicActive, setCinematicActive] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-scope auth-page-shell">
        <div className="auth-page-shell__backdrop" aria-hidden="true" />
        <div className="auth-shell" data-state={cinematicActive ? 'cinematic' : 'idle'}>
          <AuthSidebar />
          <LoginForm
            redirect={redirect}
            onCinematicStart={() => setCinematicActive(true)}
          />
          <LoginCinematicOverlay />
        </div>
      </div>
    </MotionConfig>
  );
}
