import type { DomainEvent } from '@core/events';

// ─── Event type constants ───────────────────────────────────────────────────────

export const WORKFLOW_TRIGGERED = 'workflow.triggered';
export const WORKFLOW_COMPLETED = 'workflow.completed';
export const WORKFLOW_FAILED    = 'workflow.failed';
export const WORKFLOW_CANCELLED = 'workflow.cancelled';
export const STEP_COMPLETED     = 'workflow.step_completed';
export const STEP_FAILED        = 'workflow.step_failed';

// ─── Event interfaces ───────────────────────────────────────────────────────────

export interface WorkflowTriggeredEvent extends DomainEvent {
  type: typeof WORKFLOW_TRIGGERED;
  payload: {
    workflowId: string;
    runId: string;
    triggerType: string;
    triggerPayload: Record<string, unknown>;
  };
}

export interface WorkflowCompletedEvent extends DomainEvent {
  type: typeof WORKFLOW_COMPLETED;
  payload: {
    workflowId: string;
    runId: string;
    durationMs: number;
    stepCount: number;
  };
}

export interface WorkflowFailedEvent extends DomainEvent {
  type: typeof WORKFLOW_FAILED;
  payload: {
    workflowId: string;
    runId: string;
    failedStepId?: string;
    error: string;
  };
}

export interface WorkflowCancelledEvent extends DomainEvent {
  type: typeof WORKFLOW_CANCELLED;
  payload: {
    workflowId: string;
    runId: string;
    reason?: string;
  };
}

export interface StepCompletedEvent extends DomainEvent {
  type: typeof STEP_COMPLETED;
  payload: {
    runId: string;
    stepId: string;
    stepType: string;
    durationMs: number;
  };
}

export interface StepFailedEvent extends DomainEvent {
  type: typeof STEP_FAILED;
  payload: {
    runId: string;
    stepId: string;
    stepType: string;
    error: string;
    retryCount: number;
  };
}

export type AutomationEvent =
  | WorkflowTriggeredEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | WorkflowCancelledEvent
  | StepCompletedEvent
  | StepFailedEvent;
