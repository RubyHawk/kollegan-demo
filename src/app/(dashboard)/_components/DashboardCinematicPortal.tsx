'use client';

import { useEffect, useState } from 'react';
import { useCinematic } from '@shared/stores/cinematic.store';

export function DashboardCinematicPortal() {
  const { pending, clear } = useCinematic();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (pending) {
      clear();
      setActive(true);
      // Wipe phase is (1 - 0.64) * 5.35s = 1.926s + buffer
      const timer = window.setTimeout(() => setActive(false), 2100);
      return () => window.clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  return (
    <div
      className="auth-scope soleria-cinematic-wipe"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
    >
      <div className="auth-login-cinematic">
        <div className="auth-login-cinematic__sun">
          {/* Sun glow only — no brand mark needed in wipe phase */}
        </div>
        <div className="auth-login-cinematic__glass" />
        <div className="auth-login-cinematic__glare" />
        <div className="auth-login-cinematic__film" />
        <div className="auth-login-cinematic__mist">
          <span />
          <span />
          <span />
        </div>
        <div className="auth-login-cinematic__wetness" />
        <div className="auth-login-cinematic__bubbles" />
        <div className="auth-login-cinematic__squeegee">
          <span className="auth-login-cinematic__squeegee-blade" />
          <span className="auth-login-cinematic__squeegee-handle" />
        </div>
      </div>
    </div>
  );
}
