'use client';

import {
  CalendarDots,
  ChatCircleText,
  FileText,
  Wrench,
} from '@phosphor-icons/react';

const WORKFLOW_STAGES = [
  { code: '01', label: 'Förfrågan', icon: ChatCircleText },
  { code: '02', label: 'Offert', icon: FileText },
  { code: '03', label: 'Planering', icon: CalendarDots },
  { code: '04', label: 'Montering', icon: Wrench },
] as const;

export function SceneWorkflowRail() {
  return (
    <aside className="auth-workflow-rail" aria-hidden="true">
      <div className="auth-workflow-rail__inner">
        <p className="auth-workflow-rail__eyebrow">Process</p>
        <div className="auth-workflow-rail__track">
          <div className="auth-workflow-rail__line" />
          <div className="auth-workflow-rail__scan" />
          {WORKFLOW_STAGES.map((stage, index) => (
            <div
              key={stage.code}
              className={`auth-workflow-stage auth-workflow-stage--${index + 1}`}
            >
              <div className="auth-workflow-stage__node" />
              <div className="auth-workflow-stage__body">
                <span className="auth-workflow-stage__icon">
                  <stage.icon size={13} weight="duotone" />
                </span>
                <span className="auth-workflow-stage__code">{stage.code}</span>
                <strong>{stage.label}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
