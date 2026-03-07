import { logger }    from '@platform/logging/logger';
import { eventBus }  from '@platform/events';
import { projectRepository } from '../infrastructure/project.repository';
import type { CreateProjectInput, UpdateProjectInput, ListProjectsFilter } from '../infrastructure/project.repository';
import type { Project } from '../domain/project.entity';
import {
  PROJECT_CREATED,
  PROJECT_UPDATED,
  PROJECT_DELETED,
  PROJECT_COMPLETED,
} from '../events/project.events';

export type { CreateProjectInput, UpdateProjectInput, ListProjectsFilter };

const TAG = 'ProjectsService';

// ─── createProject ────────────────────────────────────────────────────────────

export async function createProject(
  input: CreateProjectInput,
  actorId: string,
): Promise<Project> {
  const project = await projectRepository.create({ ...input, createdBy: actorId });

  eventBus.publish({
    type:       PROJECT_CREATED,
    orgId:      input.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      projectId: project.id,
      name:      project.name,
      createdBy: actorId,
    },
  });

  logger.info(TAG, `Project created: ${project.name}`, { projectId: project.id, orgId: input.organizationId });
  return project;
}

// ─── getProject ───────────────────────────────────────────────────────────────

export async function getProject(id: string, orgId: string): Promise<Project | null> {
  return projectRepository.findById(id, orgId);
}

// ─── listProjects ─────────────────────────────────────────────────────────────

export async function listProjects(
  orgId: string,
  filter: ListProjectsFilter,
): Promise<{ projects: Project[]; total: number }> {
  return projectRepository.list(orgId, filter);
}

// ─── updateProject ────────────────────────────────────────────────────────────

export async function updateProject(
  id: string,
  orgId: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  const updated = await projectRepository.update(id, orgId, input);
  if (!updated) return null;

  const changedFields = Object.keys(input).filter(
    (k) => (input as Record<string, unknown>)[k] !== undefined,
  );

  eventBus.publish({
    type:       PROJECT_UPDATED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      projectId: id,
      fields:    changedFields,
    },
  });

  // Emit completion event when status transitions to 'done'
  if (input.status === 'done') {
    eventBus.publish({
      type:       PROJECT_COMPLETED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload: {
        projectId: id,
        name:      updated.name,
      },
    });
    logger.info(TAG, `Project completed: ${updated.name}`, { projectId: id });
  }

  logger.info(TAG, `Project updated: ${id}`, { fields: changedFields });
  return updated;
}

// ─── deleteProject ────────────────────────────────────────────────────────────

export async function deleteProject(id: string, orgId: string): Promise<boolean> {
  const deleted = await projectRepository.softDelete(id, orgId);
  if (!deleted) return false;

  eventBus.publish({
    type:       PROJECT_DELETED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { projectId: id },
  });

  logger.info(TAG, `Project deleted: ${id}`);
  return deleted;
}
