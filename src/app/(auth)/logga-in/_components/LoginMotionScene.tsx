'use client';

import { AuthBrandMark } from './AuthBrandMark';

function SceneWaves() {
  return (
    <div className="auth-scene-waves" aria-hidden="true">
      <svg
        className="auth-scene-wave auth-scene-wave--a"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,120 C360,75 720,165 1080,120 C1440,75 1800,165 2160,120 C2520,75 2700,145 2880,120 L2880,200 L0,200 Z" />
      </svg>
      <svg
        className="auth-scene-wave auth-scene-wave--b"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,110 C480,70 960,150 1440,110 C1920,70 2400,150 2880,110 L2880,200 L0,200 Z" />
      </svg>
      <svg
        className="auth-scene-wave auth-scene-wave--c"
        viewBox="0 0 2880 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,95 C720,60 1440,130 2160,95 C2520,78 2700,112 2880,95 L2880,200 L0,200 Z" />
      </svg>
    </div>
  );
}

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage">
      <SceneWaves />
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
