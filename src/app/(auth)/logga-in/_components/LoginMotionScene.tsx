'use client';

import { AuthBrandMark } from './AuthBrandMark';
import { InstallationTools } from './InstallationTools';

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage" aria-label="Förberedd solfilmsmontering">
      <div className="auth-install-sky" aria-hidden="true" />
      <div className="auth-install-pane" aria-hidden="true">
        <div className="auth-install-sun">
          <AuthBrandMark size={42} />
        </div>
        <div className="auth-install-city" />
        <div className="auth-install-glare" />
        <div className="auth-install-mullions" />
        <div className="auth-install-haze" />
      </div>

      <div className="auth-install-brand">
        <AuthBrandMark size={34} />
        <span>SOLERIA</span>
      </div>

      <div className="auth-install-tools" aria-hidden="true">
        <InstallationTools />
      </div>
    </section>
  );
}
