import type { ProjectStage } from '../domain/project.entity';

export const PROJECT_CREATED = 'project.created' as const;
export const PROJECT_STAGE_ADVANCED = 'project.stage_advanced' as const;
export const PROJECT_COMPLETED = 'project.completed' as const;

export interface ProjectCreatedEvent {
  type: typeof PROJECT_CREATED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; offerId: string; customerId: string; name: string };
}

export interface ProjectStageAdvancedEvent {
  type: typeof PROJECT_STAGE_ADVANCED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; fromStage: ProjectStage; toStage: ProjectStage; actorId: string };
}

export interface ProjectCompletedEvent {
  type: typeof PROJECT_COMPLETED;
  orgId: string;
  occurredAt: string;
  payload: { projectId: string; name: string; actorId: string };
}

export type ProjectEvent = ProjectCreatedEvent | ProjectStageAdvancedEvent | ProjectCompletedEvent;
