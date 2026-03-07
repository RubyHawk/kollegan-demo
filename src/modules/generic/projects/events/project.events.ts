// ─── Project domain events ────────────────────────────────────────────────────

export const PROJECT_CREATED   = 'project.created'   as const;
export const PROJECT_UPDATED   = 'project.updated'   as const;
export const PROJECT_DELETED   = 'project.deleted'   as const;
export const PROJECT_COMPLETED = 'project.completed' as const;

export interface ProjectCreatedEvent {
  type: typeof PROJECT_CREATED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; name: string; createdBy: string };
}

export interface ProjectUpdatedEvent {
  type: typeof PROJECT_UPDATED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; fields: string[] };
}

export interface ProjectDeletedEvent {
  type: typeof PROJECT_DELETED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string };
}

export interface ProjectCompletedEvent {
  type: typeof PROJECT_COMPLETED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; name: string };
}

export type ProjectEvent =
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ProjectDeletedEvent
  | ProjectCompletedEvent;
