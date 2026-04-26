export type {
  InstallDetails,
  Project,
  ProjectLineItem,
  ProjectStage,
  ProjectStageEvent,
} from './domain/project.entity';
export {
  PROJECT_STAGE_LABELS,
  PROJECT_STAGES,
  nextProjectStage,
  validateStageTransition,
} from './domain/stage-machine';
export {
  advanceProjectStage,
  backfillAllOrganizations,
  backfillProjectsFromAcceptedOffers,
  countProjects,
  createProjectFromOffer,
  getProject,
  listProjects,
  updateProjectDetails,
} from './application/projects.service';
export type { ListProjectsFilter } from './application/projects.service';
export {
  PROJECT_COMPLETED,
  PROJECT_CREATED,
  PROJECT_STAGE_ADVANCED,
} from './events/project.events';
export type {
  ProjectCompletedEvent,
  ProjectCreatedEvent,
  ProjectEvent,
  ProjectStageAdvancedEvent,
} from './events/project.events';
export { registerProjectEventSubscribers } from './events/offer-accepted.subscriber';
export {
  handleAdvanceProjectStage,
  handleGetProject,
  handleListProjects,
  handleProjectBackfillCron,
  handleProjectCounts,
  handleUpdateProjectDetails,
} from './api/handlers/project.handler';
