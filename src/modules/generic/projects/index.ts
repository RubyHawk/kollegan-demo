/**
 * Projects Module — public interface.
 *
 * Other modules ONLY import from this file.
 */

// Domain types
export type {
  Project,
  ProjectTask,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
} from './domain/project.entity';

// Application use cases
export {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
} from './application/project.service';
export type { CreateProjectInput, UpdateProjectInput, ListProjectsFilter } from './application/project.service';

// Domain events
export {
  PROJECT_CREATED,
  PROJECT_UPDATED,
  PROJECT_DELETED,
  PROJECT_COMPLETED,
} from './events/project.events';
export type {
  ProjectEvent,
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectDeletedEvent,
  ProjectCompletedEvent,
} from './events/project.events';

// ── API Handlers ─────────────────────────────────────────────────────────────
export {
  handleListProjects,
  handleCreateProject,
  handleGetProject,
  handleUpdateProject,
  handleDeleteProject,
} from './api/handlers/project.handler';
