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
          <strong className="auth-login-cinematic__dashboard-hero-num">20</strong>
          <span className="auth-login-cinematic__dashboard-hero-label">aktiva projekt</span>
          <span className="auth-login-cinematic__dashboard-hero-sub">4 offerter väntar på svar</span>
        </div>
        <div className="auth-login-cinematic__dashboard-grid">
          <span data-label="Offerter" data-value="24" />
          <span data-label="Installation" data-value="8" />
          <span data-label="Klara" data-value="156" />
          <span data-label="Kunder" data-value="43" />
        </div>
        <div className="auth-login-cinematic__dashboard-lanes">
          <span data-name="Eriksson villa, Sundbyberg" data-status="Montering" />
          <span data-name="Kontorskomplex, Solna" data-status="Offert" />
          <span data-name="Magnolia BRF, Stockholm" data-status="Klar" />
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
