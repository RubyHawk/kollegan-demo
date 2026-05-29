'use client';

import { AuthBrandMark } from './AuthBrandMark';
import { SceneHeroCopy } from './SceneHeroCopy';

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage" aria-label="Animerad solfilmsmontering">
      <div className="auth-stage-atmosphere" aria-hidden="true" />
      <div className="auth-stage-caustics" aria-hidden="true" />
      <div className="auth-stage-window-shell" aria-hidden="true" />
      <div className="auth-stage-outside" aria-hidden="true" />
      <div className="auth-stage-sun" aria-hidden="true" />
      <div className="auth-stage-raw-heat" aria-hidden="true" />
      <div className="auth-stage-cool-film" aria-hidden="true" />
      <div className="auth-stage-window-bars" aria-hidden="true" />
      <div className="auth-stage-glass-reflections" aria-hidden="true" />
      <div className="auth-stage-measurement" aria-hidden="true" />
      <div className="auth-stage-film" aria-hidden="true" />
      <div className="auth-stage-peel-liner" aria-hidden="true" />
      <div className="auth-stage-film-roll" aria-hidden="true" />
      <div className="auth-stage-adhesive-waves" aria-hidden="true" />
      <div className="auth-stage-wake" aria-hidden="true" />
      <div className="auth-stage-bubbles" aria-hidden="true">
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
        <i className="auth-stage-bubble" />
      </div>
      <div className="auth-stage-squeegee" aria-hidden="true" />
      <div className="auth-stage-scan-line" aria-hidden="true" />
      <div className="auth-stage-edge-ripple" aria-hidden="true" />
      <div className="auth-stage-ambient-sheen" aria-hidden="true" />
      <div className="auth-stage-caption-shield" aria-hidden="true" />

      <div className="auth-scene-brand">
        <AuthBrandMark size={40} />
        <span>SOLERIA</span>
      </div>

      <SceneHeroCopy />
    </section>
  );
}
