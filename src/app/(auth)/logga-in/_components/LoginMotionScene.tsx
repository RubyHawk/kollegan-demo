'use client';

import { AuthBrandMark } from './AuthBrandMark';

const WORKFLOW_STAGES = ['Förfrågan', 'Offert', 'Planering', 'Montering'] as const;

export function LoginMotionScene() {
  return (
    <section className="auth-motion-stage" aria-label="Animerad solfilmsmontering">
      <div className="auth-stage-atmosphere" aria-hidden="true" />
      <div className="auth-stage-haze" aria-hidden="true" />
      <div className="auth-stage-skyline" aria-hidden="true" />
      <div className="auth-stage-glare" aria-hidden="true" />
      <div className="auth-stage-untreated" aria-hidden="true" />
      <div className="auth-stage-treated" aria-hidden="true" />
      <div className="auth-stage-grid" aria-hidden="true" />
      <div className="auth-stage-frame" aria-hidden="true" />
      <div className="auth-stage-film" aria-hidden="true" />
      <div className="auth-stage-waterline" aria-hidden="true" />
      <div className="auth-stage-particles" aria-hidden="true">
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
        <i className="auth-stage-particle" />
      </div>
      <div className="auth-stage-squeegee" aria-hidden="true">
        <div className="auth-stage-squeegee__blade" />
        <div className="auth-stage-squeegee__handle" />
      </div>
      <div className="auth-stage-reflection" aria-hidden="true" />

      <div className="auth-scene-brand">
        <AuthBrandMark size={42} />
        <span>SOLERIA</span>
      </div>

      <div className="auth-scene-copy">
        <p className="auth-scene-copy__eyebrow">Soleria Workspace</p>
        <h1>
          Från förfrågan till <span>färdig montering.</span>
        </h1>
        <p>
          Intern arbetsportal för offert, order, planering och installation av
          solfilm.
        </p>
      </div>

      <div className="auth-scene-stages" aria-hidden="true">
        {WORKFLOW_STAGES.map((stage) => (
          <span key={stage}>{stage}</span>
        ))}
      </div>
    </section>
  );
}
