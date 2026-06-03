'use client';

import { LOGIN_CINEMATIC_DROPLET_COUNT } from '@shared/lib/login-cinematic-timing';

interface LoginCinematicOverlayProps {
  windowMarkup: string;
}

const DROPLETS = Array.from({ length: LOGIN_CINEMATIC_DROPLET_COUNT }, (_, index) => index);

export function LoginCinematicOverlay({ windowMarkup }: LoginCinematicOverlayProps) {
  return (
    <div className="auth-login-cinematic" aria-hidden="true">
      <div className="auth-login-cinematic__window-zoom">
        {windowMarkup ? (
          <div
            className="auth-login-cinematic__window-copy"
            dangerouslySetInnerHTML={{ __html: windowMarkup }}
          />
        ) : null}
        <div className="auth-login-cinematic__sun" />
      </div>

      <div className="auth-login-cinematic__glass" />
      <div className="auth-login-cinematic__glare" />
      <div className="auth-login-cinematic__film-roll" />
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
  );
}
