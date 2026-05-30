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

  function handleCinematicStart() {
    const root = document.documentElement;
    const markEl = document.querySelector<HTMLElement>('.auth-console__brand-mark');
    if (markEl) {
      const r = markEl.getBoundingClientRect();
      root.style.setProperty('--cinematic-sun-x', `${(r.left + r.width / 2).toFixed(0)}px`);
      root.style.setProperty('--cinematic-sun-y', `${(r.top + r.height / 2).toFixed(0)}px`);
    }
    const winEl = document.querySelector<HTMLElement>('.auth-window');
    if (winEl) {
      const r = winEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      root.style.setProperty('--cinematic-win-ox', `${((r.left + r.width / 2) / vw * 100).toFixed(1)}%`);
      root.style.setProperty('--cinematic-win-oy', `${((r.top + r.height / 2) / vh * 100).toFixed(1)}%`);
    }
    setCinematicActive(true);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="auth-scope auth-page-shell"
        data-state={cinematicActive ? 'cinematic' : 'idle'}
      >
        <div className="auth-page-shell__backdrop" aria-hidden="true">
          <svg className="auth-page-wave auth-page-wave--a" viewBox="0 0 2880 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,120 C360,75 720,165 1080,120 C1440,75 1800,165 2160,120 C2520,75 2700,145 2880,120 L2880,200 L0,200 Z" />
          </svg>
          <svg className="auth-page-wave auth-page-wave--b" viewBox="0 0 2880 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,110 C480,70 960,150 1440,110 C1920,70 2400,150 2880,110 L2880,200 L0,200 Z" />
          </svg>
          <svg className="auth-page-wave auth-page-wave--c" viewBox="0 0 2880 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,95 C720,60 1440,130 2160,95 C2520,78 2700,112 2880,95 L2880,200 L0,200 Z" />
          </svg>
        </div>
        <div className="auth-shell">
          <AuthSidebar />
          <LoginForm
            redirect={redirect}
            onCinematicStart={handleCinematicStart}
          />
        </div>
        <LoginCinematicOverlay />
      </div>
    </MotionConfig>
  );
}
