'use client';

import { AuthBrandMark } from './AuthBrandMark';

export function LoginCinematicOverlay() {
  return (
    <div className="auth-login-cinematic" aria-hidden="true">
      <div className="auth-login-cinematic__sun">
        <AuthBrandMark size={34} />
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
      <div className="auth-login-cinematic__bubbles" />
      <div className="auth-login-cinematic__squeegee">
        <span className="auth-login-cinematic__squeegee-blade" />
        <span className="auth-login-cinematic__squeegee-handle" />
      </div>
    </div>
  );
}
