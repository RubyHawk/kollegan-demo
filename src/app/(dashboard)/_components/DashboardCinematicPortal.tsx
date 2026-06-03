'use client';

import { useEffect, useState } from 'react';
import {
  LOGIN_CINEMATIC_DASHBOARD_WIPE_MS,
  LOGIN_CINEMATIC_DROPLET_COUNT,
} from '@shared/lib/login-cinematic-timing';
import { useCinematic } from '@shared/stores/cinematic.store';

const DROPLETS = Array.from({ length: LOGIN_CINEMATIC_DROPLET_COUNT }, (_, index) => index);

export function DashboardCinematicPortal() {
  const { pending, clear } = useCinematic();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (pending) {
      clear();
      setActive(true);
      const timer = window.setTimeout(() => setActive(false), LOGIN_CINEMATIC_DASHBOARD_WIPE_MS);
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
        <div className="auth-login-cinematic__bubbles">
          {DROPLETS.map((drop) => <span key={drop} />)}
        </div>
        <div className="auth-login-cinematic__squeegee">
          <span className="auth-login-cinematic__squeegee-blade" />
          <span className="auth-login-cinematic__squeegee-handle" />
        </div>
      </div>
    </div>
  );
}
