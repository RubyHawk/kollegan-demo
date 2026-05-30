'use client';

import { AuthBrandMark } from './AuthBrandMark';

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage">
      <div className="auth-scene-inner">
        <div className="auth-scene-brand">
          <AuthBrandMark size={28} />
          <span>Soleria</span>
        </div>
        <div className="auth-scene-body">
          <h2 className="auth-scene-headline">Solar project<br />management.</h2>
          <p className="auth-scene-tagline">From quote to handover — one platform.</p>
        </div>
      </div>
    </section>
  );
}
