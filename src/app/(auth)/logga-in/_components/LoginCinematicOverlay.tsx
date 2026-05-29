'use client';

import { AuthBrandMark } from './AuthBrandMark';

function DashboardPreview() {
  return (
    <div className="auth-login-cinematic__dashboard-shell">
      <div className="auth-login-cinematic__dashboard-sidebar" />
      <div className="auth-login-cinematic__dashboard-main">
        <div className="auth-login-cinematic__dashboard-top">
          <span>Översikt</span>
          <span>Sök saker och genvägar...</span>
        </div>
        <div className="auth-login-cinematic__dashboard-hero">
          <span className="auth-login-cinematic__dashboard-skel auth-login-cinematic__dashboard-skel--title" />
          <span className="auth-login-cinematic__dashboard-skel auth-login-cinematic__dashboard-skel--sub" />
        </div>
        <div className="auth-login-cinematic__dashboard-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="auth-login-cinematic__dashboard-lanes">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export function LoginCinematicOverlay() {
  return (
    <div className="auth-login-cinematic" aria-hidden="true">
      <div className="auth-login-cinematic__dashboard auth-login-cinematic__dashboard-base">
        <DashboardPreview />
      </div>
      <div className="auth-login-cinematic__dashboard auth-login-cinematic__dashboard-reveal">
        <DashboardPreview />
      </div>

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
